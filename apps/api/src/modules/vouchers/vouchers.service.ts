import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, VoucherStatus, VoucherType } from "@prisma/client";
import type { ChartOfAccount, Item, Party, TaxCode } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";

type DraftInput = {
  voucherType?: VoucherType;
  voucherDate?: Date;
  partyId?: string;
  memo?: string;
  lines?: Array<{
    accountId: string;
    partyId?: string;
    itemId?: string;
    description?: string;
    debit?: number;
    credit?: number;
    taxCodeId?: string;
    taxAmount?: number;
  }>;
};

@Injectable()
export class VouchersService {
  constructor(private prisma: PrismaService) {}

  private async getCompanyOrThrow(companyId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new BadRequestException("Company not found");
    return company;
  }

  private ensureVoucherDate(company: { lockDate: Date | null }, voucherDate: Date) {
    if (company.lockDate && voucherDate <= company.lockDate) {
      throw new BadRequestException("Voucher date is locked");
    }
  }

  private async validateReferences(companyId: string, input: DraftInput) {
    const partyIds = new Set<string>();
    const accountIds = new Set<string>();
    const itemIds = new Set<string>();
    const taxCodeIds = new Set<string>();

    if (input.partyId) partyIds.add(input.partyId);
    for (const line of input.lines || []) {
      accountIds.add(line.accountId);
      if (line.partyId) partyIds.add(line.partyId);
      if (line.itemId) itemIds.add(line.itemId);
      if (line.taxCodeId) taxCodeIds.add(line.taxCodeId);
    }

    const [accounts, parties, items, taxCodes] = await Promise.all([
      accountIds.size
        ? this.prisma.chartOfAccount.findMany({
            where: { id: { in: Array.from(accountIds) }, companyId }
          })
        : Promise.resolve([] as ChartOfAccount[]),
      partyIds.size
        ? this.prisma.party.findMany({ where: { id: { in: Array.from(partyIds) }, companyId } })
        : Promise.resolve([] as Party[]),
      itemIds.size
        ? this.prisma.item.findMany({ where: { id: { in: Array.from(itemIds) }, companyId } })
        : Promise.resolve([] as Item[]),
      taxCodeIds.size
        ? this.prisma.taxCode.findMany({ where: { id: { in: Array.from(taxCodeIds) }, companyId } })
        : Promise.resolve([] as TaxCode[])
    ]);

    if (accounts.length !== accountIds.size) throw new BadRequestException("Invalid account");
    if (parties.length !== partyIds.size) throw new BadRequestException("Invalid party");
    if (items.length !== itemIds.size) throw new BadRequestException("Invalid item");
    if (taxCodes.length !== taxCodeIds.size) throw new BadRequestException("Invalid tax code");

    if (accounts.some((a) => !a.isActive || !a.isPostable)) {
      throw new BadRequestException("Account not postable");
    }
  }

  private normalizeLines(lines: NonNullable<DraftInput["lines"]>) {
    if (lines.length === 0) throw new BadRequestException("Lines required");
    return lines.map((line, idx) => {
      const debit = Number(line.debit || 0);
      const credit = Number(line.credit || 0);
      if (debit < 0 || credit < 0) throw new BadRequestException("Negative amounts not allowed");
      if ((debit > 0 && credit > 0) || (debit === 0 && credit === 0)) {
        throw new BadRequestException("Each line must have either debit or credit");
      }
      return {
        lineNo: idx + 1,
        accountId: line.accountId,
        partyId: line.partyId,
        itemId: line.itemId,
        description: line.description,
        debit: new Prisma.Decimal(debit),
        credit: new Prisma.Decimal(credit),
        taxCodeId: line.taxCodeId,
        taxAmount: new Prisma.Decimal(line.taxAmount || 0)
      };
    });
  }

  private computeTotals(lines: { debit: Prisma.Decimal; credit: Prisma.Decimal }[]) {
    let debit = new Prisma.Decimal(0);
    let credit = new Prisma.Decimal(0);
    for (const line of lines) {
      debit = debit.add(line.debit);
      credit = credit.add(line.credit);
    }
    return { debit, credit };
  }

  async createDraft(user: AuthUser, input: DraftInput) {
    if (!input.voucherType || !input.voucherDate || !input.lines) {
      throw new BadRequestException("Missing draft fields");
    }
    if (input.voucherType === VoucherType.reversal) {
      throw new BadRequestException("Reversal vouchers can only be created by void");
    }

    const company = await this.getCompanyOrThrow(user.companyId);
    this.ensureVoucherDate(company, input.voucherDate);
    await this.validateReferences(user.companyId, input);
    const lines = this.normalizeLines(input.lines);

    const voucher = await this.prisma.voucher.create({
      data: {
        companyId: user.companyId,
        voucherType: input.voucherType,
        status: VoucherStatus.draft,
        voucherDate: input.voucherDate,
        partyId: input.partyId,
        memo: input.memo,
        createdByUserId: user.sub,
        lines: {
          create: lines.map((l) => ({ ...l, companyId: user.companyId }))
        }
      },
      include: { lines: true }
    });

    return voucher;
  }

  async updateDraft(user: AuthUser, voucherId: string, input: DraftInput) {
    const voucher = await this.prisma.voucher.findFirst({
      where: { id: voucherId, companyId: user.companyId }
    });
    if (!voucher) throw new NotFoundException("Voucher not found");
    if (voucher.status !== VoucherStatus.draft) throw new ForbiddenException("Only draft vouchers can be edited");
    if (input.voucherType === VoucherType.reversal) {
      throw new BadRequestException("Reversal vouchers can only be created by void");
    }

    const data: Prisma.VoucherUpdateInput = {};
    if (input.voucherType) data.voucherType = input.voucherType;
    if (input.voucherDate) data.voucherDate = input.voucherDate;
    if (input.partyId !== undefined) {
      data.party = input.partyId ? { connect: { id: input.partyId } } : { disconnect: true };
    }
    if (input.memo !== undefined) data.memo = input.memo;

    return this.prisma.$transaction(async (tx) => {
      const company = await this.getCompanyOrThrow(user.companyId);
      if (input.voucherDate) this.ensureVoucherDate(company, input.voucherDate);
      if (input.lines || input.partyId) await this.validateReferences(user.companyId, input);

      if (input.lines) {
        const lines = this.normalizeLines(input.lines);
        await tx.voucherLine.deleteMany({ where: { voucherId: voucher.id } });
        await tx.voucherLine.createMany({
          data: lines.map((l) => ({ ...l, voucherId: voucher.id, companyId: user.companyId }))
        });
      }

      const updated = await tx.voucher.update({
        where: { id: voucher.id },
        data
      });

      return tx.voucher.findUnique({ where: { id: updated.id }, include: { lines: true } });
    });
  }

  async preview(user: AuthUser, voucherId: string) {
    const voucher = await this.prisma.voucher.findFirst({
      where: { id: voucherId, companyId: user.companyId },
      include: { lines: true }
    });
    if (!voucher) throw new NotFoundException("Voucher not found");

    const totals = this.computeTotals(
      voucher.lines.map((l) => ({ debit: l.debit, credit: l.credit }))
    );
    const balanced = totals.debit.equals(totals.credit);

    return {
      voucherId: voucher.id,
      status: voucher.status,
      totalDebit: totals.debit,
      totalCredit: totals.credit,
      balanced
    };
  }

  async post(user: AuthUser, voucherId: string) {
    return this.prisma.$transaction(async (tx) => {
      const voucher = await tx.voucher.findFirst({
        where: { id: voucherId, companyId: user.companyId },
        include: { lines: true }
      });
      if (!voucher) throw new NotFoundException("Voucher not found");
      if (voucher.status !== VoucherStatus.draft) throw new ForbiddenException("Only draft vouchers can be posted");
      if (voucher.lines.length === 0) throw new BadRequestException("Voucher has no lines");

      const totals = this.computeTotals(
        voucher.lines.map((l) => ({ debit: l.debit, credit: l.credit }))
      );
      if (!totals.debit.equals(totals.credit)) throw new BadRequestException("Voucher not balanced");

      const company = await tx.company.findUnique({ where: { id: user.companyId } });
      if (!company) throw new BadRequestException("Company not found");
      this.ensureVoucherDate(company, voucher.voucherDate);

      await this.validateReferences(user.companyId, {
        partyId: voucher.partyId || undefined,
        lines: voucher.lines.map((l) => ({
          accountId: l.accountId,
          partyId: l.partyId || undefined,
          itemId: l.itemId || undefined,
          taxCodeId: l.taxCodeId || undefined
        }))
      });

      const sequence = company.nextInvoiceNumber;
      const prefix =
        voucher.voucherType === VoucherType.sales_invoice
          ? company.invoicePrefix
          : voucher.voucherType.replace("_", "-").toUpperCase();
      const voucherNumber = `${prefix}-${sequence}`;

      const posted = await tx.voucher.update({
        where: { id: voucher.id },
        data: {
          status: VoucherStatus.posted,
          postedAt: new Date(),
          postedByUserId: user.sub,
          voucherNumber
        }
      });

      await tx.company.update({
        where: { id: company.id },
        data: { nextInvoiceNumber: sequence + 1 }
      });

      return tx.voucher.findUnique({ where: { id: posted.id }, include: { lines: true } });
    });
  }

  async void(user: AuthUser, voucherId: string) {
    return this.prisma.$transaction(async (tx) => {
      const voucher = await tx.voucher.findFirst({
        where: { id: voucherId, companyId: user.companyId },
        include: { lines: true }
      });
      if (!voucher) throw new NotFoundException("Voucher not found");
      if (voucher.status !== VoucherStatus.posted) throw new ForbiddenException("Only posted vouchers can be voided");

      const reversal = await tx.voucher.create({
        data: {
          companyId: voucher.companyId,
          voucherType: VoucherType.reversal,
          status: VoucherStatus.posted,
          voucherDate: new Date(),
          partyId: voucher.partyId,
          memo: `Reversal of ${voucher.voucherNumber || voucher.id}`,
          postedAt: new Date(),
          postedByUserId: user.sub,
          reversalOfVoucherId: voucher.id,
          lines: {
            create: voucher.lines.map((l, idx) => ({
              companyId: voucher.companyId,
              lineNo: idx + 1,
              accountId: l.accountId,
              partyId: l.partyId,
              itemId: l.itemId,
              description: l.description,
              debit: l.credit,
              credit: l.debit,
              taxCodeId: l.taxCodeId,
              taxAmount: l.taxAmount
            }))
          }
        }
      });

      await tx.voucher.update({
        where: { id: voucher.id },
        data: {
          status: VoucherStatus.void,
          voidedAt: new Date(),
          voidedByUserId: user.sub
        }
      });

      return { voidedVoucherId: voucher.id, reversalVoucherId: reversal.id };
    });
  }

  async getById(user: AuthUser, voucherId: string) {
    const voucher = await this.prisma.voucher.findFirst({
      where: { id: voucherId, companyId: user.companyId },
      include: { lines: true }
    });
    if (!voucher) throw new NotFoundException("Voucher not found");
    return voucher;
  }

  async list(
    user: AuthUser,
    filters: {
      status?: VoucherStatus;
      voucherType?: VoucherType;
      partyId?: string;
      from?: Date;
      to?: Date;
      skip?: number;
      take?: number;
    }
  ) {
    const where: Prisma.VoucherWhereInput = { companyId: user.companyId };
    if (filters.status) where.status = filters.status;
    if (filters.voucherType) where.voucherType = filters.voucherType;
    if (filters.partyId) where.partyId = filters.partyId;
    if (filters.from || filters.to) {
      where.voucherDate = {};
      if (filters.from) (where.voucherDate as Prisma.DateTimeFilter).gte = filters.from;
      if (filters.to) (where.voucherDate as Prisma.DateTimeFilter).lte = filters.to;
    }

    return this.prisma.voucher.findMany({
      where,
      orderBy: [{ voucherDate: "desc" }, { createdAt: "desc" }],
      skip: filters.skip || 0,
      take: filters.take || 50,
      select: {
        id: true,
        voucherNumber: true,
        voucherDate: true,
        voucherType: true,
        status: true,
        partyId: true,
        memo: true,
        createdAt: true,
        postedAt: true
      }
    });
  }
}
