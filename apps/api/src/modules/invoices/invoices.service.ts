import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, VoucherStatus, VoucherType } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  private async getCompany(companyId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new BadRequestException("Company not found");
    return company;
  }

  private async validateItems(companyId: string, items: Array<{ itemId?: string; taxCodeId?: string }>) {
    const itemIds = Array.from(new Set(items.map((i) => i.itemId).filter(Boolean))) as string[];
    const taxCodeIds = Array.from(new Set(items.map((i) => i.taxCodeId).filter(Boolean))) as string[];

    if (itemIds.length) {
      const dbItems = await this.prisma.item.findMany({ where: { id: { in: itemIds }, companyId } });
      if (dbItems.length !== itemIds.length) throw new BadRequestException("Invalid item");
    }
    if (taxCodeIds.length) {
      const dbTax = await this.prisma.taxCode.findMany({ where: { id: { in: taxCodeIds }, companyId } });
      if (dbTax.length !== taxCodeIds.length) throw new BadRequestException("Invalid tax code");
    }
  }

  private computeTotals(
    items: Array<{ qty: number; rate: number; taxCodeId?: string; taxAmount?: Prisma.Decimal }>
  ) {
    let subtotal = new Prisma.Decimal(0);
    let vatAmount = new Prisma.Decimal(0);
    for (const item of items) {
      const lineAmount = new Prisma.Decimal(item.qty).mul(item.rate);
      subtotal = subtotal.add(lineAmount);
      if (item.taxAmount) vatAmount = vatAmount.add(item.taxAmount);
    }
    const total = subtotal.add(vatAmount);
    return { subtotal, vatAmount, total };
  }

  async preview(
    user: AuthUser,
    input: {
      type: "sales" | "sales_return";
      partyId: string;
      date: Date;
      dueDate?: Date;
      receivableAccountId: string;
      items: Array<{ itemId?: string; description?: string; qty: number; rate: number; taxCodeId?: string }>;
    }
  ) {
    await this.validateItems(user.companyId, input.items);
    const party = await this.prisma.party.findFirst({
      where: { id: input.partyId, companyId: user.companyId }
    });
    if (!party) throw new BadRequestException("Party not found");

    const itemsWithTax = await Promise.all(
      input.items.map(async (item) => {
        let taxAmount = new Prisma.Decimal(0);
        if (item.taxCodeId) {
          const tax = await this.prisma.taxCode.findUnique({ where: { id: item.taxCodeId } });
          if (!tax) throw new BadRequestException("Invalid tax code");
          const amount = new Prisma.Decimal(item.qty).mul(item.rate);
          taxAmount = amount.mul(tax.rate).div(100);
        }
        return {
          ...item,
          amount: new Prisma.Decimal(item.qty).mul(item.rate),
          taxAmount
        };
      })
    );

    const totals = this.computeTotals(itemsWithTax);

    const voucherLines: Array<{
      accountId: string;
      debit: Prisma.Decimal;
      credit: Prisma.Decimal;
      description?: string;
      taxCodeId?: string;
      taxAmount?: Prisma.Decimal;
    }> = [];

    const receivable = await this.prisma.chartOfAccount.findFirst({
      where: { id: input.receivableAccountId, companyId: user.companyId }
    });
    if (!receivable) throw new BadRequestException("Receivable account not found");
    if (receivable.type !== "asset") {
      throw new BadRequestException("Receivable account must be an asset");
    }

    const itemMap = new Map<string, string>();
    if (itemsWithTax.some((i) => i.itemId)) {
      const itemIds = itemsWithTax.map((i) => i.itemId).filter(Boolean) as string[];
      const dbItems = await this.prisma.item.findMany({ where: { id: { in: itemIds }, companyId: user.companyId } });
      for (const dbItem of dbItems) {
        if (!dbItem.incomeAccountId) throw new BadRequestException("Item missing income account");
        itemMap.set(dbItem.id, dbItem.incomeAccountId);
      }
    }

    for (const item of itemsWithTax) {
      const accountId = item.itemId ? itemMap.get(item.itemId) : undefined;
      if (!accountId) throw new BadRequestException("Item missing income account");
      if (input.type === "sales") {
        voucherLines.push({
          accountId,
          debit: new Prisma.Decimal(0),
          credit: item.amount,
          description: item.description,
          taxCodeId: item.taxCodeId,
          taxAmount: item.taxAmount
        });
      } else {
        voucherLines.push({
          accountId,
          debit: item.amount,
          credit: new Prisma.Decimal(0),
          description: item.description,
          taxCodeId: item.taxCodeId,
          taxAmount: item.taxAmount
        });
      }
    }

    const taxGroups = new Map<string, Prisma.Decimal>();
    for (const item of itemsWithTax) {
      if (!item.taxCodeId || item.taxAmount.lte(0)) continue;
      taxGroups.set(
        item.taxCodeId,
        (taxGroups.get(item.taxCodeId) || new Prisma.Decimal(0)).add(item.taxAmount)
      );
    }

    if (taxGroups.size) {
      const taxCodes = await this.prisma.taxCode.findMany({
        where: { id: { in: Array.from(taxGroups.keys()) }, companyId: user.companyId }
      });
      for (const taxCode of taxCodes) {
        if (!taxCode.outputTaxAccountId) throw new BadRequestException("Tax code missing output account");
        const amount = taxGroups.get(taxCode.id) || new Prisma.Decimal(0);
        if (input.type === "sales") {
          voucherLines.push({
            accountId: taxCode.outputTaxAccountId,
            debit: new Prisma.Decimal(0),
            credit: amount,
            description: "Output VAT",
            taxCodeId: taxCode.id,
            taxAmount: amount
          });
        } else {
          voucherLines.push({
            accountId: taxCode.outputTaxAccountId,
            debit: amount,
            credit: new Prisma.Decimal(0),
            description: "Output VAT",
            taxCodeId: taxCode.id,
            taxAmount: amount
          });
        }
      }
    }

    if (input.type === "sales") {
      voucherLines.push({
        accountId: receivable.id,
        debit: totals.total,
        credit: new Prisma.Decimal(0),
        description: "Accounts Receivable"
      });
    } else {
      voucherLines.push({
        accountId: receivable.id,
        debit: new Prisma.Decimal(0),
        credit: totals.total,
        description: "Accounts Receivable"
      });
    }

    return {
      totals,
      voucherType: input.type === "sales" ? VoucherType.sales_invoice : VoucherType.sales_return,
      voucherLines,
      receivableAccountId: receivable.id,
      items: itemsWithTax
    };
  }

  async createDraft(
    user: AuthUser,
    input: {
      type: "sales" | "sales_return";
      partyId: string;
      date: Date;
      dueDate?: Date;
      receivableAccountId: string;
      items: Array<{ itemId?: string; description?: string; qty: number; rate: number; taxCodeId?: string }>;
    }
  ) {
    const preview = await this.preview(user, input);
    const totals = preview.totals;

    return this.prisma.invoice.create({
      data: {
        companyId: user.companyId,
        type: input.type,
        partyId: input.partyId,
        date: input.date,
        dueDate: input.dueDate,
        receivableAccountId: input.receivableAccountId,
        subtotal: totals.subtotal,
        vatAmount: totals.vatAmount,
        total: totals.total,
        status: "draft",
        items: {
          create: preview.items.map((item) => ({
            itemId: item.itemId,
            description: item.description,
            qty: new Prisma.Decimal(item.qty),
            rate: new Prisma.Decimal(item.rate),
            amount: item.amount,
            taxCodeId: item.taxCodeId,
            taxAmount: item.taxAmount
          }))
        }
      },
      include: { items: true }
    });
  }

  async post(user: AuthUser, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, companyId: user.companyId },
      include: { items: true }
    });
    if (!invoice) throw new NotFoundException("Invoice not found");
    if (invoice.status !== "draft") throw new ForbiddenException("Only draft invoices can be posted");

    const company = await this.getCompany(user.companyId);
    if (company.lockDate && invoice.date <= company.lockDate) {
      throw new BadRequestException("Invoice date is locked");
    }

    const preview = await this.preview(user, {
      type: invoice.type as "sales" | "sales_return",
      partyId: invoice.partyId,
      date: invoice.date,
      dueDate: invoice.dueDate || undefined,
      receivableAccountId: invoice.receivableAccountId,
      items: invoice.items.map((i) => ({
        itemId: i.itemId || undefined,
        description: i.description || undefined,
        qty: i.qty.toNumber(),
        rate: i.rate.toNumber(),
        taxCodeId: i.taxCodeId || undefined
      }))
    });

    const voucherType = invoice.type === "sales" ? VoucherType.sales_invoice : VoucherType.sales_return;
    const sequence = company.nextInvoiceNumber;
    const voucherNumber = `${company.invoicePrefix}-${sequence}`;

    return this.prisma.$transaction(async (tx) => {
      const voucher = await tx.voucher.create({
        data: {
          companyId: user.companyId,
          voucherType,
          status: VoucherStatus.posted,
          voucherDate: invoice.date,
          partyId: invoice.partyId,
          memo: `Invoice ${invoice.id}`,
          postedAt: new Date(),
          postedByUserId: user.sub,
          voucherNumber,
          lines: {
            create: preview.voucherLines.map((l, idx) => ({
              companyId: user.companyId,
              lineNo: idx + 1,
              accountId: l.accountId,
              description: l.description,
              debit: l.debit,
              credit: l.credit,
              taxCodeId: l.taxCodeId,
              taxAmount: l.taxAmount || new Prisma.Decimal(0)
            }))
          }
        }
      });

      await tx.company.update({
        where: { id: company.id },
        data: { nextInvoiceNumber: sequence + 1 }
      });

      return tx.invoice.update({
        where: { id: invoice.id },
        data: {
          status: "posted",
          voucherId: voucher.id,
          invoiceNo: voucherNumber
        }
      });
    });
  }

  async void(user: AuthUser, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, companyId: user.companyId }
    });
    if (!invoice) throw new NotFoundException("Invoice not found");
    if (invoice.status !== "posted" || !invoice.voucherId) {
      throw new ForbiddenException("Only posted invoices can be voided");
    }

    await this.prisma.voucher.update({
      where: { id: invoice.voucherId },
      data: { status: VoucherStatus.void, voidedAt: new Date(), voidedByUserId: user.sub }
    });

    return this.prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: "void" }
    });
  }

  async list(user: AuthUser, filters: { type?: string; status?: string; from?: Date; to?: Date; skip?: number; take?: number }) {
    const where: Prisma.InvoiceWhereInput = { companyId: user.companyId };
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.from || filters.to) {
      where.date = {};
      if (filters.from) (where.date as Prisma.DateTimeFilter).gte = filters.from;
      if (filters.to) (where.date as Prisma.DateTimeFilter).lte = filters.to;
    }

    return this.prisma.invoice.findMany({
      where,
      orderBy: { date: "desc" },
      skip: filters.skip || 0,
      take: filters.take || 50
    });
  }

  async getById(user: AuthUser, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, companyId: user.companyId },
      include: { items: true }
    });
    if (!invoice) throw new NotFoundException("Invoice not found");
    return invoice;
  }
}
