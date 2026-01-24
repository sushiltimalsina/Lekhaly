import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma, VoucherStatus, VoucherType } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";
import { resolveAdDate } from "../../common/date/nepali-date";

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getStock(user: AuthUser, itemId: string, filters: { from?: Date; to?: Date }) {
    const item = await this.prisma.item.findFirst({
      where: { id: itemId, companyId: user.companyId }
    });
    if (!item) throw new BadRequestException("Item not found");

    const where: Prisma.StockLedgerWhereInput = { companyId: user.companyId, itemId };
    if (filters.from || filters.to) {
      where.date = {};
      if (filters.from) (where.date as Prisma.DateTimeFilter).gte = filters.from;
      if (filters.to) (where.date as Prisma.DateTimeFilter).lte = filters.to;
    }

    const entries = await this.prisma.stockLedger.findMany({
      where,
      orderBy: { date: "asc" }
    });

    let qty = new Prisma.Decimal(0);
    for (const e of entries) {
      qty = qty.add(e.qtyIn).sub(e.qtyOut);
    }

    return { itemId, qty, entries };
  }

  async adjustStock(
    user: AuthUser,
    input: { itemId: string; date?: Date; dateBs?: string; qty: number; rate?: number; accountId: string; memo?: string }
  ) {
    const item = await this.prisma.item.findFirst({
      where: { id: input.itemId, companyId: user.companyId }
    });
    if (!item) throw new BadRequestException("Item not found");

    const account = await this.prisma.chartOfAccount.findFirst({
      where: { id: input.accountId, companyId: user.companyId }
    });
    if (!account) throw new BadRequestException("Account not found");

    const inventoryAccountId = item.expenseAccountId || item.incomeAccountId;
    if (!inventoryAccountId) throw new BadRequestException("Item missing inventory account");

    const qty = new Prisma.Decimal(input.qty);
    if (qty.equals(0)) throw new BadRequestException("Quantity cannot be zero");
    const rate = new Prisma.Decimal(input.rate ?? 0);
    const amount = qty.abs().mul(rate);
    const resolved = resolveAdDate(input.date, input.dateBs);

    return this.prisma.$transaction(async (tx) => {
      const voucher = await tx.voucher.create({
        data: {
          companyId: user.companyId,
          voucherType: VoucherType.journal,
          status: VoucherStatus.posted,
          voucherDate: resolved.date,
          voucherDateBs: resolved.bs || null,
          memo: input.memo || "Stock adjustment",
          postedAt: new Date(),
          postedByUserId: user.sub,
          lines: {
            create: qty.gt(0)
              ? [
                  {
                    companyId: user.companyId,
                    lineNo: 1,
                    accountId: inventoryAccountId,
                    debit: amount,
                    credit: new Prisma.Decimal(0),
                    description: "Stock increase"
                  },
                  {
                    companyId: user.companyId,
                    lineNo: 2,
                    accountId: account.id,
                    debit: new Prisma.Decimal(0),
                    credit: amount,
                    description: "Stock increase offset"
                  }
                ]
              : [
                  {
                    companyId: user.companyId,
                    lineNo: 1,
                    accountId: account.id,
                    debit: new Prisma.Decimal(0),
                    credit: amount,
                    description: "Stock decrease"
                  },
                  {
                    companyId: user.companyId,
                    lineNo: 2,
                    accountId: inventoryAccountId,
                    debit: amount,
                    credit: new Prisma.Decimal(0),
                    description: "Stock decrease offset"
                  }
                ]
          }
        }
      });

      await tx.stockLedger.create({
        data: {
          companyId: user.companyId,
          itemId: item.id,
          date: resolved.date,
          dateBs: resolved.bs || null,
          voucherId: voucher.id,
          qtyIn: qty.gt(0) ? qty : new Prisma.Decimal(0),
          qtyOut: qty.lt(0) ? qty.abs() : new Prisma.Decimal(0),
          rate,
          amount
        }
      });

      return { ok: true, voucherId: voucher.id };
    });
  }

  async getStockReport(user: AuthUser, filters: { from?: Date; to?: Date }) {
    const items = await this.prisma.item.findMany({
      where: { companyId: user.companyId },
      orderBy: { name: "asc" },
      include: {
        incomeAccount: { select: { name: true } },
        expenseAccount: { select: { name: true } }
      }
    });

    const periodWhere: Prisma.StockLedgerWhereInput = { companyId: user.companyId };
    if (filters.from || filters.to) {
      periodWhere.date = {};
      if (filters.from) (periodWhere.date as Prisma.DateTimeFilter).gte = filters.from;
      if (filters.to) (periodWhere.date as Prisma.DateTimeFilter).lte = filters.to;
    }

    const openingWhere: Prisma.StockLedgerWhereInput | null = filters.from
      ? { companyId: user.companyId, date: { lt: filters.from } }
      : null;

    const [periodEntries, openingEntries] = await Promise.all([
      this.prisma.stockLedger.findMany({ where: periodWhere }),
      openingWhere ? this.prisma.stockLedger.findMany({ where: openingWhere }) : Promise.resolve([])
    ]);

    const zero = new Prisma.Decimal(0);
    const stats = new Map<
      string,
      {
        openQty: Prisma.Decimal;
        openAmt: Prisma.Decimal;
        inQty: Prisma.Decimal;
        inAmt: Prisma.Decimal;
        outQty: Prisma.Decimal;
        outAmt: Prisma.Decimal;
      }
    >();

    const getStats = (itemId: string) => {
      const current = stats.get(itemId);
      if (current) return current;
      const next = { openQty: zero, openAmt: zero, inQty: zero, inAmt: zero, outQty: zero, outAmt: zero };
      stats.set(itemId, next);
      return next;
    };

    for (const e of openingEntries) {
      const s = getStats(e.itemId);
      s.openQty = s.openQty.add(e.qtyIn).sub(e.qtyOut);
      if (e.qtyIn.gt(0)) s.openAmt = s.openAmt.add(e.amount);
      if (e.qtyOut.gt(0)) s.openAmt = s.openAmt.sub(e.amount);
    }

    for (const e of periodEntries) {
      const s = getStats(e.itemId);
      if (e.qtyIn.gt(0)) {
        s.inQty = s.inQty.add(e.qtyIn);
        s.inAmt = s.inAmt.add(e.amount);
      }
      if (e.qtyOut.gt(0)) {
        s.outQty = s.outQty.add(e.qtyOut);
        s.outAmt = s.outAmt.add(e.amount);
      }
    }

    return items.map((item) => {
      const s = stats.get(item.id) ?? {
        openQty: zero,
        openAmt: zero,
        inQty: zero,
        inAmt: zero,
        outQty: zero,
        outAmt: zero
      };

      const closingQty = s.openQty.add(s.inQty).sub(s.outQty);
      const closingAmt = s.openAmt.add(s.inAmt).sub(s.outAmt);

      const opAvg = s.openQty.equals(0) ? zero : s.openAmt.div(s.openQty);
      const inAvg = s.inQty.equals(0) ? zero : s.inAmt.div(s.inQty);
      const outAvg = s.outQty.equals(0) ? zero : s.outAmt.div(s.outQty);
      const closingPrice = closingQty.equals(0) ? zero : closingAmt.div(closingQty);

      return {
        id: item.id,
        name: item.name,
        sku: item.sku,
        unit: item.unit,
        type: (item as any).type ?? "goods",
        parentGroup: item.incomeAccount?.name ?? item.expenseAccount?.name ?? "—",
        openingQty: Number(s.openQty.toString()),
        openingAvgPrice: Number(opAvg.toString()),
        openingAmt: Number(s.openAmt.toString()),
        purchaseQty: Number(s.inQty.toString()),
        purchaseAvgPrice: Number(inAvg.toString()),
        purchaseAmt: Number(s.inAmt.toString()),
        saleQty: Number(s.outQty.toString()),
        saleAvgPrice: Number(outAvg.toString()),
        saleAmt: Number(s.outAmt.toString()),
        closingQty: Number(closingQty.toString()),
        closingPrice: Number(closingPrice.toString()),
        closingAmt: Number(closingAmt.toString())
      };
    });
  }
}
