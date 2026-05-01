import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, VoucherStatus, VoucherType } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";
import { resolveAdDate } from "../../common/date/nepali-date";

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) { }

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

    const goodsIds = dbItems.filter((i: any) => i.type !== "services").map((i) => i.id);
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
      referenceNo?: string;
      items: Array<{ itemId?: string; description?: string; qty: number; rate: number; taxCodeId?: string; taxCodeIds?: string[] }>;
      sundries?: Array<{ billSundryId?: string; name: string; type: "add" | "less"; rate?: number | null; amount: number }>;
      memo?: string;
      additionalNote?: string;
      paymentMethodId?: string;
      saleTypeId?: string;
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

    // Add sundries to total
    let sundryNet = new Prisma.Decimal(0);
    const billSundryIds = (input.sundries || []).map(s => s.billSundryId).filter(Boolean) as string[];
    const dbBillSundries = billSundryIds.length
      ? await this.prisma.billSundry.findMany({ where: { id: { in: billSundryIds } } })
      : [];

    const processedSundries = (input.sundries || []).map(s => {
      const amount = new Prisma.Decimal(s.amount);
      if (s.type === "add") sundryNet = sundryNet.add(amount);
      else sundryNet = sundryNet.sub(amount);

      const dbSundry = s.billSundryId ? dbBillSundries.find((b: any) => b.id === s.billSundryId) : null;
      return {
        ...s,
        amount,
        accountId: dbSundry?.accountId || undefined
      };
    });
    totals.total = totals.total.add(sundryNet);

    const voucherLines: Array<{
      accountId: string;
      partyId?: string;
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
      const [dbItems, fallbackIncome] = await Promise.all([
        this.prisma.item.findMany({ where: { id: { in: itemIds }, companyId: user.companyId } }),
        this.prisma.chartOfAccount.findFirst({
          where: { companyId: user.companyId, type: "income", code: "4000" }
        })
      ]);
      const incomeFallback =
        fallbackIncome ??
        (await this.prisma.chartOfAccount.findFirst({
          where: { companyId: user.companyId, type: "income" }
        }));
      for (const dbItem of dbItems) {
        const incomeId = dbItem.incomeAccountId || incomeFallback?.id;
        if (!incomeId) {
          throw new BadRequestException("Item missing income account");
        }
        itemMap.set(dbItem.id, incomeId);
      }
    }

    for (const item of itemsWithTax) {
      const accountId = item.itemId ? itemMap.get(item.itemId) : undefined;
      // Map item lines
      if (accountId) {
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

    for (const s of processedSundries) {
      if (s.amount.lte(0)) continue;

      const accountId = s.accountId;
      if (!accountId) continue;

      const isAdd = s.type === "add";
      const isSales = input.type === "sales";

      if (isSales) {
        voucherLines.push({
          accountId,
          debit: isAdd ? new Prisma.Decimal(0) : s.amount,
          credit: isAdd ? s.amount : new Prisma.Decimal(0),
          description: s.name
        });
      } else {
        voucherLines.push({
          accountId,
          debit: isAdd ? s.amount : new Prisma.Decimal(0),
          credit: isAdd ? new Prisma.Decimal(0) : s.amount,
          description: s.name
        });
      }
    }

    if (input.type === "sales") {
      voucherLines.push({
        accountId: receivable.id,
        partyId: input.partyId,
        debit: totals.total,
        credit: new Prisma.Decimal(0),
        description: "Accounts Receivable"
      });
    } else {
      voucherLines.push({
        accountId: receivable.id,
        partyId: input.partyId,
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
      sundries: processedSundries,
      date: resolvedDate.date,
      dateBs: resolvedDate.bs || input.dateBs,
      dueDate: resolvedDue?.date,
      dueDateBs: resolvedDue?.bs || input.dueDateBs,
      referenceNo: input.referenceNo,
      memo: input.memo,
      additionalNote: input.additionalNote,
      paymentMethodId: input.paymentMethodId,
      saleTypeId: input.saleTypeId
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
      referenceNo?: string;
      items: Array<{ itemId?: string; description?: string; qty: number; rate: number; taxCodeId?: string; taxCodeIds?: string[] }>;
      sundries?: Array<{ billSundryId?: string; name: string; type: "add" | "less"; rate?: number | null; amount: number }>;
      memo?: string;
      additionalNote?: string;
      paymentMethodId?: string;
      saleTypeId?: string;
    }
  ) {
    try {
      const preview = await this.preview(user, input);
      const totals = preview.totals;

      return await this.prisma.invoice.create({
        data: {
          companyId: user.companyId,
          type: input.type,
          partyId: input.partyId,
          date: preview.date,
          dateBs: preview.dateBs || null,
          dueDate: preview.dueDate,
          dueDateBs: preview.dueDateBs || null,
          referenceNo: preview.referenceNo,
          receivableAccountId: input.receivableAccountId,
          subtotal: totals.subtotal,
          vatAmount: totals.vatAmount,
          total: totals.total,
          status: "draft",
          memo: input.memo,
          additionalNote: input.additionalNote,
          paymentMethodId: input.paymentMethodId,
          saleTypeId: input.saleTypeId,
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
          },
          sundries: {
            create: preview.sundries.map((s: any) => ({
              billSundryId: s.billSundryId,
              name: s.name,
              type: s.type,
              rate: s.rate ? new Prisma.Decimal(s.rate) : null,
              amount: s.amount,
              accountId: s.accountId
            }))
          }
        },
        include: { items: true, sundries: true }
      });
    } catch (e: any) {
      throw new BadRequestException(e.message ?? "Failed to save draft");
    }
  }

  async post(user: AuthUser, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, companyId: user.companyId },
      include: { items: true, sundries: true }
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
      referenceNo: invoice.referenceNo || undefined,
      receivableAccountId: invoice.receivableAccountId,
      items: invoice.items.map((i: any) => ({
        itemId: i.itemId || undefined,
        description: i.description || undefined,
        qty: i.qty.toNumber ? i.qty.toNumber() : Number(i.qty),
        rate: i.rate.toNumber ? i.rate.toNumber() : Number(i.rate),
        taxCodeId: i.taxCodeId || undefined
      })),
      sundries: (invoice.sundries as any[]).map((s: any) => ({
        billSundryId: s.billSundryId || undefined,
        name: s.name,
        type: s.type as any,
        rate: s.rate?.toNumber ? s.rate.toNumber() : (s.rate ? Number(s.rate) : null),
        amount: s.amount.toNumber ? s.amount.toNumber() : Number(s.amount)
      })),
      memo: invoice.memo || undefined,
      additionalNote: invoice.additionalNote || undefined
    });

    if (invoice.type === "sales") {
      await this.enforceStockForSales(user, invoice.items.map((i: any) => ({
        itemId: i.itemId || undefined,
        qty: i.qty.toNumber ? i.qty.toNumber() : Number(i.qty)
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
          referenceNo: invoice.referenceNo,
          memo: preview.memo || `Invoice ${invoice.id}`,
          additionalNote: preview.additionalNote,
          postedAt: new Date(),
          postedByUserId: user.sub,
          voucherNumber,
          lines: {
            create: preview.voucherLines.map((l, idx) => ({
              companyId: user.companyId,
              lineNo: idx + 1,
              accountId: l.accountId,
              partyId: l.partyId,
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

      const stockLedgerData = [];
      for (const item of invoice.items) {
        if (!item.itemId) continue;
        const isOut = invoice.type === "sales" || invoice.type === "purchase_return";
        const isIn = invoice.type === "purchase" || invoice.type === "sales_return";

        const qty = item.qty.toNumber ? item.qty.toNumber() : Number(item.qty);
        const rate = item.rate.toNumber ? item.rate.toNumber() : Number(item.rate);

        // Check if this item is a kit — if so, do hybrid stock fulfillment
        const itemRecord = await tx.item.findUnique({
          where: { id: item.itemId },
          include: { components: true }
        });

        // Helper to compute Moving Average Cost (MAC)
        const computeMAC = async (targetItemId: string) => {
          const allEntries = await tx.stockLedger.findMany({
            where: { companyId: user.companyId, itemId: targetItemId },
            select: { qtyIn: true, qtyOut: true, amount: true }
          });
          let totalQty = 0;
          let totalValue = 0;
          for (const entry of allEntries) {
            const qIn = Number(entry.qtyIn || 0);
            const qOut = Number(entry.qtyOut || 0);
            const amt = Number(entry.amount || 0);
            if (qIn > 0) { totalQty += qIn; totalValue += amt; }
            if (qOut > 0) { totalQty -= qOut; totalValue -= amt; }
          }
          return {
            stock: totalQty,
            avgCost: totalQty > 0 ? (totalValue / totalQty) : 0
          };
        };

        if (itemRecord?.isKit && itemRecord.components.length > 0 && isOut) {
          // Smart Hybrid Kit Fulfillment
          const kitMac = await computeMAC(item.itemId);
          const currentKitStock = kitMac.stock;
          
          let qtyToDeductKit = 0;
          let qtyToExplode = qty;

          if (currentKitStock > 0) {
            qtyToDeductKit = Math.min(currentKitStock, qty);
            qtyToExplode = qty - qtyToDeductKit;
          }

          if (qtyToDeductKit > 0) {
            stockLedgerData.push({
              companyId: user.companyId,
              itemId: item.itemId,
              date: invoice.date,
              voucherId: voucher.id,
              qtyIn: 0,
              qtyOut: qtyToDeductKit,
              rate: kitMac.avgCost,
              amount: qtyToDeductKit * kitMac.avgCost
            });
          }

          if (qtyToExplode > 0) {
            // Auto-explode the remaining required quantity
            for (const comp of itemRecord.components) {
              const compQty = Number(comp.qty) * qtyToExplode;
              const compMac = await computeMAC(comp.componentId);

              stockLedgerData.push({
                companyId: user.companyId,
                itemId: comp.componentId,
                date: invoice.date,
                voucherId: voucher.id,
                qtyIn: 0,
                qtyOut: compQty,
                rate: compMac.avgCost,
                amount: compQty * compMac.avgCost
              });
            }
          }
        } else {
          // Standard item (or INBOUND Kit)
          let finalRate = rate;
          let finalAmount = qty * rate;

          if (isOut) {
            // For outward movements, use Moving Average Cost instead of Sales Price
            const stdMac = await computeMAC(item.itemId);
            finalRate = stdMac.avgCost;
            finalAmount = qty * stdMac.avgCost;
          }

          stockLedgerData.push({
            companyId: user.companyId,
            itemId: item.itemId,
            date: invoice.date,
            voucherId: voucher.id,
            qtyIn: isIn ? qty : 0,
            qtyOut: isOut ? qty : 0,
            rate: finalRate,
            amount: finalAmount
          });
        }
      }

      if (stockLedgerData.length > 0) {
        await tx.stockLedger.createMany({ data: stockLedgerData });
      }

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

    const voucherId = invoice.voucherId;

    await this.prisma.$transaction(async (tx) => {
      await tx.voucher.update({
        where: { id: voucherId },
        data: { status: VoucherStatus.void, voidedAt: new Date(), voidedByUserId: user.sub }
      });

      await tx.stockLedger.deleteMany({
        where: { voucherId }
      });

      await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: "void" }
      });
    });

    return { success: true };
  }

  async list(user: AuthUser, filters: { type?: string; status?: string; q?: string; from?: Date; to?: Date; skip?: number; take?: number }) {
    const where: Prisma.InvoiceWhereInput = { companyId: user.companyId };
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.from || filters.to) {
      where.date = {};
      if (filters.from) (where.date as Prisma.DateTimeFilter).gte = filters.from;
      if (filters.to) (where.date as Prisma.DateTimeFilter).lte = filters.to;
    }

    if (filters.q) {
      where.OR = [
        { invoiceNo: { contains: filters.q, mode: "insensitive" } },
        { referenceNo: { contains: filters.q, mode: "insensitive" } },
        { memo: { contains: filters.q, mode: "insensitive" } },
        { additionalNote: { contains: filters.q, mode: "insensitive" } },
        { party: { name: { contains: filters.q, mode: "insensitive" } } }
      ];
    }

    return this.prisma.invoice.findMany({
      where,
      include: {
        party: {
          select: { id: true, name: true, panNumber: true, vatNumber: true }
        },
        items: {
          include: {
            item: { select: { id: true, name: true } }
          }
        },
        voucher: {
          select: { memo: true, referenceNo: true, additionalNote: true, postedAt: true }
        }
      },
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
        },
        sundries: true
      }
    });
    if (!invoice) throw new NotFoundException("Invoice not found");
    return {
      ...invoice,
      items: invoice.items.map((it: any) => ({
        ...it,
        itemName: it.item?.name ?? undefined,
        hsCode: it.item?.hsCode ?? undefined,
        taxBreakdown: it.taxes?.map((t: any) => ({
          taxCodeId: t.taxCodeId,
          name: t.taxCode?.name,
          rate: t.taxCode?.rate,
          taxAmount: t.taxAmount
        }))
      }))
    };
  }

  async updateDraft(
    user: AuthUser,
    id: string,
    input: {
      type: "sales" | "sales_return";
      partyId: string;
      date?: Date;
      dateBs?: string;
      dueDate?: Date;
      dueDateBs?: string;
      receivableAccountId: string;
      referenceNo?: string;
      items: Array<{ itemId?: string; description?: string; qty: number; rate: number; taxCodeId?: string; taxCodeIds?: string[] }>;
      sundries?: Array<{ billSundryId?: string; name: string; type: "add" | "less"; rate?: number | null; amount: number }>;
      memo?: string;
      additionalNote?: string;
      paymentMethodId?: string;
      saleTypeId?: string;
    }
  ) {
    const existing = await this.prisma.invoice.findFirst({
      where: { id, companyId: user.companyId }
    });
    if (!existing) throw new NotFoundException("Invoice not found");
    if (existing.status !== "draft") throw new ForbiddenException("Only draft invoices can be updated");

    const preview = await this.preview(user, input);
    const totals = preview.totals;

    return await this.prisma.$transaction(async (tx) => {
      // Clear old items and sundries
      await tx.invoiceItemTax.deleteMany({ where: { invoiceItem: { invoiceId: id } } });
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
      await tx.invoiceSundry.deleteMany({ where: { invoiceId: id } });

      return await tx.invoice.update({
        where: { id },
        data: {
          type: input.type,
          partyId: input.partyId,
          date: preview.date,
          dateBs: preview.dateBs || null,
          dueDate: preview.dueDate,
          dueDateBs: preview.dueDateBs || null,
          referenceNo: preview.referenceNo,
          receivableAccountId: input.receivableAccountId,
          subtotal: totals.subtotal,
          vatAmount: totals.vatAmount,
          total: totals.total,
          memo: input.memo,
          additionalNote: input.additionalNote,
          paymentMethodId: input.paymentMethodId,
          saleTypeId: input.saleTypeId,
          items: {
            create: preview.items.map((item: any) => ({
              itemId: item.itemId,
              description: item.description,
              qty: new Prisma.Decimal(item.qty),
              rate: new Prisma.Decimal(item.rate),
              amount: item.amount,
              taxCodeId: item.taxCodeId,
              taxAmount: item.taxAmount,
              taxes: {
                create: (item.taxCodeIds || []).map((tId: string) => ({
                  taxCodeId: tId,
                  taxAmount: 0 // Will be computed if needed elsewhere, but following creation pattern
                }))
              }
            }))
          },
          sundries: {
            create: (input.sundries || []).map((s) => ({
              billSundryId: s.billSundryId,
              name: s.name,
              type: s.type,
              rate: s.rate ? new Prisma.Decimal(s.rate) : null,
              amount: new Prisma.Decimal(s.amount)
            }))
          }
        }
      });
    });
  }
}
