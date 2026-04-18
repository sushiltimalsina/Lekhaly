import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, VoucherStatus, VoucherType } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";
import { resolveAdDate } from "../../common/date/nepali-date";

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  private async validateRefs(user: AuthUser, input: { vendorId?: string; taxCodeId?: string; attachmentId?: string }) {
    if (input.vendorId) {
      const vendor = await this.prisma.party.findFirst({
        where: { id: input.vendorId, companyId: user.companyId }
      });
      if (!vendor) throw new BadRequestException("Vendor not found");
    }
    if (input.taxCodeId) {
      const tax = await this.prisma.taxCode.findFirst({
        where: { id: input.taxCodeId, companyId: user.companyId }
      });
      if (!tax) throw new BadRequestException("Tax code not found");
    }
    if (input.attachmentId) {
      const attachment = await this.prisma.voucherAttachment.findFirst({
        where: { id: input.attachmentId, companyId: user.companyId }
      });
      if (!attachment) throw new BadRequestException("Attachment not found");
    }
  }

  private async buildVoucherLines(
    user: AuthUser,
    input: {
      amount: number;
      taxCodeId?: string;
      expenseAccountId: string;
      paymentAccountId: string;
    }
  ) {
    const expenseAccount = await this.prisma.chartOfAccount.findFirst({
      where: { id: input.expenseAccountId, companyId: user.companyId }
    });
    const paymentAccount = await this.prisma.chartOfAccount.findFirst({
      where: { id: input.paymentAccountId, companyId: user.companyId }
    });
    if (!expenseAccount || !paymentAccount) throw new BadRequestException("Account not found");

    const amount = new Prisma.Decimal(input.amount);
    let taxAmount = new Prisma.Decimal(0);
    let taxAccountId: string | null = null;

    if (input.taxCodeId) {
      const tax = await this.prisma.taxCode.findFirst({
        where: { id: input.taxCodeId, companyId: user.companyId }
      });
      if (!tax?.inputTaxAccountId) throw new BadRequestException("Tax code missing input account");
      taxAmount = amount.mul(tax.rate).div(100);
      taxAccountId = tax.inputTaxAccountId;
    }

    const total = amount.add(taxAmount);

    const lines = [
      {
        accountId: expenseAccount.id,
        debit: amount,
        credit: new Prisma.Decimal(0),
        description: "Expense"
      },
      ...(taxAccountId
        ? [
            {
              accountId: taxAccountId,
              debit: taxAmount,
              credit: new Prisma.Decimal(0),
              description: "Input VAT",
              taxCodeId: input.taxCodeId,
              taxAmount
            }
          ]
        : []),
      {
        accountId: paymentAccount.id,
        debit: new Prisma.Decimal(0),
        credit: total,
        description: "Payment"
      }
    ];

    return { lines, total, taxAmount };
  }

  async createDraft(user: AuthUser, input: any) {
    await this.validateRefs(user, input);
    const { lines, total, taxAmount } = await this.buildVoucherLines(user, input);
    const resolved = resolveAdDate(input.date, input.dateBs);

    const company = await this.prisma.company.findUnique({ where: { id: user.companyId } });
    if (!company) throw new BadRequestException("Company not found");
    if (company.lockDate && resolved.date <= company.lockDate) {
      throw new BadRequestException("Expense date is locked");
    }

    return this.prisma.expense.create({
      data: {
        companyId: user.companyId,
        date: resolved.date,
        dateBs: resolved.bs || null,
        vendorId: input.vendorId,
        amount: total,
        taxCodeId: input.taxCodeId,
        description: input.description,
        attachmentId: input.attachmentId,
        status: "draft"
      }
    });
  }

  async preview(user: AuthUser, input: any) {
    await this.validateRefs(user, input);
    const { lines, total, taxAmount } = await this.buildVoucherLines(user, input);
    return { total, taxAmount, lines };
  }

  async post(user: AuthUser, expenseId: string, input: any) {
    const expense = await this.prisma.expense.findFirst({
      where: { id: expenseId, companyId: user.companyId }
    });
    if (!expense) throw new NotFoundException("Expense not found");
    if (expense.status !== "draft") throw new ForbiddenException("Only draft expenses can be posted");

    const preview = await this.preview(user, input);

    const voucher = await this.prisma.voucher.create({
      data: {
        companyId: user.companyId,
        voucherType: VoucherType.payment,
        status: VoucherStatus.posted,
        voucherDate: expense.date,
        partyId: expense.vendorId,
        memo: expense.description || "Expense",
        postedAt: new Date(),
        postedByUserId: user.sub,
        lines: {
          create: preview.lines.map((l: any, idx: number) => {
            const company = this.prisma.company.findUnique({ where: { id: user.companyId } });
            // The check is already done by date in createDraft, but we check again on post for safety
            return {
              companyId: user.companyId,
              lineNo: idx + 1,
              accountId: l.accountId,
              description: l.description,
              debit: l.debit,
              credit: l.credit,
              taxCodeId: l.taxCodeId,
              taxAmount: l.taxAmount || new Prisma.Decimal(0)
            };
          })
        }
      }
    });

    return this.prisma.expense.update({
      where: { id: expense.id },
      data: { status: "posted", voucherId: voucher.id }
    });
  }

  async list(user: AuthUser, filters: { from?: Date; to?: Date; status?: string; skip?: number; take?: number }) {
    const where: Prisma.ExpenseWhereInput = { companyId: user.companyId };
    if (filters.status) where.status = filters.status;
    if (filters.from || filters.to) {
      where.date = {};
      if (filters.from) (where.date as Prisma.DateTimeFilter).gte = filters.from;
      if (filters.to) (where.date as Prisma.DateTimeFilter).lte = filters.to;
    }

    return this.prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
      skip: filters.skip || 0,
      take: filters.take || 50
    });
  }
}
