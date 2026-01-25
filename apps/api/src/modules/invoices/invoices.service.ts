import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, VoucherStatus, VoucherType } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";
import { resolveAdDate } from "../../common/date/nepali-date";

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  private async getCompany(companyId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new BadRequestException("Company not found");
    return company;
  }

  private async validateItems(
    companyId: string,
    items: Array<{ itemId?: string; taxCodeId?: string; taxCodeIds?: string[] }>
  ) {
    const itemIds = Array.from(new Set(items.map((i) => i.itemId).filter(Boolean))) as string[];
    const taxCodeIds = Array.from(
      new Set(
        items.flatMap((i) => [
          ...(i.taxCodeId ? [i.taxCodeId] : []),
          ...(Array.isArray(i.taxCodeIds) ? i.taxCodeIds : [])
        ])
      )
    ) as string[];

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

  private async enforceStockForSales(
    user: AuthUser,
    items: Array<{ itemId?: string; qty: number }>
  ) {
    const itemIds = Array.from(new Set(items.map((i) => i.itemId).filter(Boolean))) as string[];
    if (!itemIds.length) return;

    const dbItems = await this.prisma.item.findMany({
      where: { id: { in: itemIds }, companyId: user.companyId },
      select: { id: true, name: true, type: true }
    });

    const goodsIds = dbItems.filter((i) => (i as any).type !== "services").map((i) => i.id);
    if (!goodsIds.length) return;

    const ledger = await this.prisma.stockLedger.findMany({
      where: { companyId: user.companyId, itemId: { in: goodsIds } },
      select: { itemId: true, qtyIn: true, qtyOut: true }
    });

    const stockMap = new Map<string, Prisma.Decimal>();
    for (const entry of ledger) {
      const current = stockMap.get(entry.itemId) || new Prisma.Decimal(0);
      stockMap.set(entry.itemId, current.add(entry.qtyIn).sub(entry.qtyOut));
    }

    for (const line of items) {
      if (!line.itemId) continue;
      const item = dbItems.find((i) => i.id === line.itemId);
      if (!item || (item as any).type === "services") continue;
      const available = stockMap.get(line.itemId) || new Prisma.Decimal(0);
      const required = new Prisma.Decimal(line.qty);
      if (available.sub(required).lt(0)) {
        throw new BadRequestException(`Insufficient stock for ${item.name}`);
      }
    }
  }

  async preview(
    user: AuthUser,
    input: {
      type: "sales" | "sales_return";
      partyId: string;
      date?: Date;
      dateBs?: string;
      dueDate?: Date;
      dueDateBs?: string;
      receivableAccountId: string;
      items: Array<{ itemId?: string; description?: string; qty: number; rate: number; taxCodeId?: string; taxCodeIds?: string[] }>;
    }
  ) {
    await this.validateItems(user.companyId, input.items);
    if (input.type === "sales") {
      await this.enforceStockForSales(user, input.items.map((item) => ({
        itemId: item.itemId,
        qty: item.qty
      })));
    }
    const party = await this.prisma.party.findFirst({
      where: { id: input.partyId, companyId: user.companyId }
    });
    if (!party) throw new BadRequestException("Party not found");

    const resolvedDate = resolveAdDate(input.date, input.dateBs);
    const resolvedDue = input.dueDate || input.dueDateBs ? resolveAdDate(input.dueDate, input.dueDateBs) : null;

    const itemIds = Array.from(new Set(input.items.map((i) => i.itemId).filter(Boolean))) as string[];
    const itemDefaults = itemIds.length
      ? await this.prisma.item.findMany({
          where: { id: { in: itemIds }, companyId: user.companyId },
          select: { id: true, taxCodeId: true }
        })
      : [];

    const explicitTaxIds = Array.from(
      new Set(
        input.items.flatMap((i) => [
          ...(i.taxCodeId ? [i.taxCodeId] : []),
          ...(Array.isArray(i.taxCodeIds) ? i.taxCodeIds : [])
        ]).concat(itemDefaults.map((i) => i.taxCodeId).filter(Boolean) as string[])
      )
    ) as string[];

    const [explicitTaxCodes, itemTaxLinks] = await Promise.all([
      explicitTaxIds.length
        ? this.prisma.taxCode.findMany({ where: { id: { in: explicitTaxIds }, companyId: user.companyId } })
        : Promise.resolve([]),
      itemIds.length
        ? this.prisma.itemTaxCode.findMany({
            where: { itemId: { in: itemIds } },
            include: { taxCode: true }
          })
        : Promise.resolve([])
    ]);

    const explicitTaxMap = new Map(explicitTaxCodes.map((t) => [t.id, t]));
    const itemTaxMap = new Map<string, typeof explicitTaxCodes>();
    for (const link of itemTaxLinks) {
      const list = itemTaxMap.get(link.itemId) || [];
      list.push(link.taxCode);
      itemTaxMap.set(link.itemId, list);
    }
    for (const item of itemDefaults) {
      if (!item.taxCodeId) continue;
      if (itemTaxMap.has(item.id)) continue;
      const tax = explicitTaxMap.get(item.taxCodeId);
      if (tax) itemTaxMap.set(item.id, [tax]);
    }

    const itemsWithTax = input.items.map((item) => {
      const amount = new Prisma.Decimal(item.qty).mul(item.rate);
      const chosenTaxCodes = Array.isArray(item.taxCodeIds) && item.taxCodeIds.length
        ? item.taxCodeIds.map((id) => explicitTaxMap.get(id)).filter(Boolean)
        : item.taxCodeId
          ? [explicitTaxMap.get(item.taxCodeId)].filter(Boolean)
          : item.itemId
            ? (itemTaxMap.get(item.itemId) ?? [])
            : [];

      const taxBreakdown = (chosenTaxCodes as Array<NonNullable<typeof chosenTaxCodes[number]>>).map((tax) => ({
        taxCodeId: tax.id,
        taxAmount: amount.mul(tax.rate).div(100)
      }));
      const taxAmount = taxBreakdown.reduce((sum, t) => sum.add(t.taxAmount), new Prisma.Decimal(0));
      const singleTaxId = taxBreakdown.length === 1 ? taxBreakdown[0].taxCodeId : undefined;

      return {
        ...item,
        amount,
        taxAmount,
        taxCodeId: singleTaxId,
        taxBreakdown
      };
    });

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
    for (const item of itemsWithTax as Array<{ taxBreakdown?: Array<{ taxCodeId: string; taxAmount: Prisma.Decimal }> }>) {
      const breakdown = item.taxBreakdown ?? [];
      for (const t of breakdown) {
        if (t.taxAmount.lte(0)) continue;
        taxGroups.set(
          t.taxCodeId,
          (taxGroups.get(t.taxCodeId) || new Prisma.Decimal(0)).add(t.taxAmount)
        );
      }
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
      items: itemsWithTax,
      date: resolvedDate.date,
      dateBs: resolvedDate.bs || input.dateBs,
      dueDate: resolvedDue?.date,
      dueDateBs: resolvedDue?.bs || input.dueDateBs
    };
  }

  async createDraft(
    user: AuthUser,
    input: {
      type: "sales" | "sales_return";
      partyId: string;
      date?: Date;
      dateBs?: string;
      dueDate?: Date;
      dueDateBs?: string;
      receivableAccountId: string;
      items: Array<{ itemId?: string; description?: string; qty: number; rate: number; taxCodeId?: string; taxCodeIds?: string[] }>;
    }
  ) {
    const preview = await this.preview(user, input);
    const totals = preview.totals;

    return this.prisma.invoice.create({
      data: {
        companyId: user.companyId,
        type: input.type,
        partyId: input.partyId,
        date: preview.date,
        dateBs: preview.dateBs || null,
        dueDate: preview.dueDate,
        dueDateBs: preview.dueDateBs || null,
        receivableAccountId: input.receivableAccountId,
        subtotal: totals.subtotal,
        vatAmount: totals.vatAmount,
        total: totals.total,
        status: "draft",
        items: {
          create: preview.items.map((item: any) => ({
            itemId: item.itemId,
            description: item.description,
            qty: new Prisma.Decimal(item.qty),
            rate: new Prisma.Decimal(item.rate),
            amount: item.amount,
            taxCodeId: item.taxCodeId,
            taxAmount: item.taxAmount,
            taxes: item.taxBreakdown?.length
              ? {
                  create: item.taxBreakdown.map((t: any) => ({
                    taxCodeId: t.taxCodeId,
                    taxAmount: t.taxAmount
                  }))
                }
              : undefined
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

    if (invoice.type === "sales") {
      await this.enforceStockForSales(user, invoice.items.map((i) => ({
        itemId: i.itemId || undefined,
        qty: i.qty.toNumber()
      })));
    }

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
      include: {
        items: {
          include: {
            item: { select: { id: true, name: true, hsCode: true } },
            taxes: { include: { taxCode: true } }
          }
        }
      }
    });
    if (!invoice) throw new NotFoundException("Invoice not found");
    return {
      ...invoice,
      items: invoice.items.map((it) => ({
        ...it,
        itemName: it.item?.name ?? undefined,
        hsCode: it.item?.hsCode ?? undefined,
        taxBreakdown: (it as any).taxes?.map((t: any) => ({
          taxCodeId: t.taxCodeId,
          name: t.taxCode?.name,
          rate: t.taxCode?.rate,
          taxAmount: t.taxAmount
        }))
      }))
    };
  }
}
