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
    if ((item as any).type === "services") {
      return { itemId, qty: new Prisma.Decimal(0), entries: [] };
    }

    const where: Prisma.StockLedgerWhereInput = { companyId: user.companyId, itemId };
    if (filters.from || filters.to) {
      where.date = {};
      if (filters.from) (where.date as Prisma.DateTimeFilter).gte = filters.from;
      if (filters.to) (where.date as Prisma.DateTimeFilter).lte = filters.to;
    }

    const entries = await this.prisma.stockLedger.findMany({
      where,
      orderBy: { date: "asc" },
      include: {
        voucher: {
          select: {
            id: true,
            voucherNumber: true,
            voucherType: true,
            voucherDate: true
          }
        }
      }
    });

    let qty = new Prisma.Decimal(0);
    for (const e of entries) {
      qty = qty.add(e.qtyIn).sub(e.qtyOut);
    }

    return {
      itemId,
      qty,
      entries: entries.map((e) => ({
        id: e.id,
        date: e.date,
        dateBs: e.dateBs,
        qtyIn: Number(e.qtyIn.toString()),
        qtyOut: Number(e.qtyOut.toString()),
        rate: Number(e.rate.toString()),
        amount: Number(e.amount.toString()),
        batchNo: e.batchNo ?? null,
        lotNo: e.lotNo ?? null,
        expiryDate: e.expiryDate ?? null,
        expiryDateBs: e.expiryDateBs ?? null,
        voucherId: e.voucherId,
        voucherNumber: e.voucher?.voucherNumber ?? null,
        voucherType: e.voucher?.voucherType ?? null,
        voucherDate: e.voucher?.voucherDate ?? null
      }))
    };
  }

  async adjustStock(
    user: AuthUser,
    input: {
      itemId: string;
      date?: Date;
      dateBs?: string;
      qty: number;
      rate?: number;
      accountId: string;
      memo?: string;
      batchNo?: string;
      lotNo?: string;
      expiryDate?: Date;
      expiryDateBs?: string;
      allowNegativeOverride?: boolean;
      overrideReason?: string;
    }
  ) {
    const item = await this.prisma.item.findFirst({
      where: { id: input.itemId, companyId: user.companyId }
    });
    if (!item) throw new BadRequestException("Item not found");
    if ((item as any).type === "services") {
      throw new BadRequestException("Service items do not track stock");
    }

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

    // Negative stock prevention with explicit override scaffold.
    if (qty.lt(0)) {
      const balance = await this.prisma.stockLedger.aggregate({
        where: { companyId: user.companyId, itemId: item.id },
        _sum: { qtyIn: true, qtyOut: true }
      });
      const currentQty = new Prisma.Decimal(balance._sum.qtyIn ?? 0).sub(new Prisma.Decimal(balance._sum.qtyOut ?? 0));
      const projectedQty = currentQty.sub(qty.abs());
      if (projectedQty.lt(0) && !input.allowNegativeOverride) {
        throw new BadRequestException(
          `Negative stock not allowed for "${item.name}". Current: ${currentQty.toString()}, Requested out: ${qty.abs().toString()}.`
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const voucher = await tx.voucher.create({
        data: {
          companyId: user.companyId,
          voucherType: VoucherType.journal,
          status: VoucherStatus.posted,
          voucherDate: resolved.date,
          voucherDateBs: resolved.bs || null,
          memo:
            input.memo ||
            (input.allowNegativeOverride && input.overrideReason
              ? `Stock adjustment (override): ${input.overrideReason}`
              : "Stock adjustment"),
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
          amount,
          batchNo: input.batchNo || null,
          lotNo: input.lotNo || null,
          expiryDate: input.expiryDate || null,
          expiryDateBs: input.expiryDateBs || null
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
        expenseAccount: { select: { name: true } },
        group: { select: { name: true } }
      }
    });

    const periodWhere: Prisma.StockLedgerWhereInput = { companyId: user.companyId };
    if (filters.from || filters.to) {
      periodWhere.date = {};
      if (filters.from) (periodWhere.date as Prisma.DateTimeFilter).gte = filters.from;
      if (filters.to) (periodWhere.date as Prisma.DateTimeFilter).lte = filters.to;
    }

    const openingWhere: Prisma.StockLedgerWhereInput | null = filters.from
      ? { companyId: user.companyId, date: { lt: filters.from }, voucherId: { not: null } }
      : null;

    const [periodEntries, openingEntries, openingSeedEntries, reservationRows] = await Promise.all([
      this.prisma.stockLedger.findMany({ where: periodWhere }),
      openingWhere ? this.prisma.stockLedger.findMany({ where: openingWhere }) : Promise.resolve([]),
      this.prisma.stockLedger.findMany({
        where: { companyId: user.companyId, voucherId: null }
      }),
      this.prisma.salesOrderItem.findMany({
        where: {
          order: {
            companyId: user.companyId,
            status: "open"
          },
          itemId: { not: null }
        },
        select: {
          itemId: true,
          qty: true,
          fulfilledQty: true
        }
      })
    ]);

    const zero = new Prisma.Decimal(0);
    const reservedByItem = new Map<string, Prisma.Decimal>();
    for (const row of reservationRows) {
      const itemId = row.itemId;
      if (!itemId) continue;
      const pending = row.qty.sub(row.fulfilledQty);
      if (pending.lte(0)) continue;
      const prev = reservedByItem.get(itemId) ?? zero;
      reservedByItem.set(itemId, prev.add(pending));
    }

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

    // Seed rows created from item opening stock use voucherId = null.
    // Keep them in opening balances so opening qty/amount stay stable.
    for (const e of openingSeedEntries) {
      const s = getStats(e.itemId);
      s.openQty = s.openQty.add(e.qtyIn).sub(e.qtyOut);
      if (e.qtyIn.gt(0)) s.openAmt = s.openAmt.add(e.amount);
      if (e.qtyOut.gt(0)) s.openAmt = s.openAmt.sub(e.amount);
    }

    for (const e of periodEntries) {
      if (!e.voucherId) continue;
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
      if ((item as any).type === "services") {
        return {
          id: item.id,
          name: item.name,
          sku: item.sku,
          hsCode: (item as any).hsCode ?? null,
          unit: item.unit,
          type: (item as any).type ?? "services",
          parentGroup: item.group?.name ?? item.incomeAccount?.name ?? item.expenseAccount?.name ?? "—",
          reorderLevel: Number((item as any).reorderLevel ?? 0),
          safetyStock: Number((item as any).safetyStock ?? 0),
          onHandQty: 0,
          reservedQty: 0,
          availableQty: 0,
          isLowStock: false,
          openingQty: 0,
          openingAvgPrice: 0,
          openingAmt: 0,
          purchaseQty: 0,
          purchaseAvgPrice: 0,
          purchaseAmt: 0,
          saleQty: 0,
          saleAvgPrice: 0,
          saleAmt: 0,
          closingQty: 0,
          closingPrice: 0,
          closingAmt: 0
        };
      }
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
      const reorderLevel = Number((item as any).reorderLevel ?? 0);
      const safetyStock = Number((item as any).safetyStock ?? 0);
      const onHandQty = Number(closingQty.toString());
      const reservedQty = Number((reservedByItem.get(item.id) ?? zero).toString());
      const availableQty = onHandQty - reservedQty;
      const lowStockThreshold = Math.max(reorderLevel, safetyStock);
      const isLowStock = availableQty <= lowStockThreshold;

      const opAvg = s.openQty.equals(0) ? zero : s.openAmt.div(s.openQty);
      const inAvg = s.inQty.equals(0) ? zero : s.inAmt.div(s.inQty);
      const outAvg = s.outQty.equals(0) ? zero : s.outAmt.div(s.outQty);
      const closingPrice = closingQty.equals(0) ? zero : closingAmt.div(closingQty);

      return {
        id: item.id,
        name: item.name,
        sku: item.sku,
        hsCode: (item as any).hsCode ?? null,
        unit: item.unit,
        type: (item as any).type ?? "goods",
        parentGroup: item.group?.name ?? item.incomeAccount?.name ?? item.expenseAccount?.name ?? "—",
        reorderLevel,
        safetyStock,
        onHandQty,
        reservedQty,
        availableQty,
        isLowStock,
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

  async transferStock(
    user: AuthUser,
    input: {
      itemId: string;
      fromWarehouseId: string;
      fromBinId?: string;
      toWarehouseId: string;
      toBinId?: string;
      qty: number;
      rate?: number;
      batchNo?: string;
      lotNo?: string;
      expiryDate?: Date;
      expiryDateBs?: string;
      date?: Date;
      dateBs?: string;
      memo?: string;
    }
  ) {
    const item = await this.prisma.item.findFirst({
      where: { id: input.itemId, companyId: user.companyId }
    });
    if (!item) throw new BadRequestException("Item not found");
    if ((item as any).type === "services") throw new BadRequestException("Service items cannot be transferred");

    const [fromWarehouse, toWarehouse] = await Promise.all([
      this.prisma.warehouse.findFirst({ where: { id: input.fromWarehouseId, companyId: user.companyId, isActive: true } }),
      this.prisma.warehouse.findFirst({ where: { id: input.toWarehouseId, companyId: user.companyId, isActive: true } })
    ]);
    if (!fromWarehouse) throw new BadRequestException("Source warehouse not found");
    if (!toWarehouse) throw new BadRequestException("Destination warehouse not found");

    if (input.fromBinId) {
      const fromBin = await this.prisma.warehouseBin.findFirst({
        where: { id: input.fromBinId, companyId: user.companyId, warehouseId: input.fromWarehouseId, isActive: true }
      });
      if (!fromBin) throw new BadRequestException("Source bin not found");
    }
    if (input.toBinId) {
      const toBin = await this.prisma.warehouseBin.findFirst({
        where: { id: input.toBinId, companyId: user.companyId, warehouseId: input.toWarehouseId, isActive: true }
      });
      if (!toBin) throw new BadRequestException("Destination bin not found");
    }

    const qty = new Prisma.Decimal(input.qty);
    const rate = new Prisma.Decimal(input.rate ?? 0);
    const amount = qty.mul(rate);
    const resolved = resolveAdDate(input.date, input.dateBs);

    // Negative stock prevention at source location scope.
    const sourceBalance = await this.prisma.stockLedger.aggregate({
      where: {
        companyId: user.companyId,
        itemId: input.itemId,
        warehouseId: input.fromWarehouseId,
        binId: input.fromBinId ?? null
      },
      _sum: { qtyIn: true, qtyOut: true }
    });
    const sourceQty = new Prisma.Decimal(sourceBalance._sum.qtyIn ?? 0).sub(new Prisma.Decimal(sourceBalance._sum.qtyOut ?? 0));
    if (sourceQty.lt(qty)) {
      throw new BadRequestException(
        `Insufficient source stock in ${fromWarehouse.name}. Available: ${sourceQty.toString()}, Requested: ${qty.toString()}`
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const voucher = await tx.voucher.create({
        data: {
          companyId: user.companyId,
          voucherType: VoucherType.journal,
          status: VoucherStatus.posted,
          voucherDate: resolved.date,
          voucherDateBs: resolved.bs || null,
          memo: input.memo || `Stock transfer: ${fromWarehouse.name} -> ${toWarehouse.name}`,
          postedAt: new Date(),
          postedByUserId: user.sub
        }
      });

      await tx.stockLedger.create({
        data: {
          companyId: user.companyId,
          itemId: input.itemId,
          date: resolved.date,
          dateBs: resolved.bs || null,
          voucherId: voucher.id,
          warehouseId: input.fromWarehouseId,
          binId: input.fromBinId ?? null,
          qtyIn: new Prisma.Decimal(0),
          qtyOut: qty,
          rate,
          amount,
          batchNo: input.batchNo || null,
          lotNo: input.lotNo || null,
          expiryDate: input.expiryDate || null,
          expiryDateBs: input.expiryDateBs || null
        }
      });

      await tx.stockLedger.create({
        data: {
          companyId: user.companyId,
          itemId: input.itemId,
          date: resolved.date,
          dateBs: resolved.bs || null,
          voucherId: voucher.id,
          warehouseId: input.toWarehouseId,
          binId: input.toBinId ?? null,
          qtyIn: qty,
          qtyOut: new Prisma.Decimal(0),
          rate,
          amount,
          batchNo: input.batchNo || null,
          lotNo: input.lotNo || null,
          expiryDate: input.expiryDate || null,
          expiryDateBs: input.expiryDateBs || null
        }
      });

      return { ok: true, voucherId: voucher.id };
    });
  }

  async getInventoryAlerts(
    user: AuthUser,
    query: { expiringWithinDays?: number; noMovementDays?: number; limit?: number }
  ) {
    const expiringWithinDays = query.expiringWithinDays ?? 30;
    const noMovementDays = query.noMovementDays ?? 90;
    const limit = query.limit ?? 100;
    const now = new Date();
    const expiringCutoff = new Date(now);
    expiringCutoff.setDate(expiringCutoff.getDate() + expiringWithinDays);
    const noMovementCutoff = new Date(now);
    noMovementCutoff.setDate(noMovementCutoff.getDate() - noMovementDays);

    const report = await this.getStockReport(user, {});
    const goods = report.filter((r: any) => r.type === "goods");

    const belowReorder = goods
      .filter((r: any) => Boolean(r.isLowStock))
      .slice(0, limit)
      .map((r: any) => ({
        itemId: r.id,
        name: r.name,
        sku: r.sku ?? null,
        availableQty: r.availableQty ?? 0,
        reorderLevel: r.reorderLevel ?? 0,
        safetyStock: r.safetyStock ?? 0
      }));

    const zeroStock = goods
      .filter((r: any) => Number(r.onHandQty ?? r.closingQty ?? 0) <= 0)
      .slice(0, limit)
      .map((r: any) => ({
        itemId: r.id,
        name: r.name,
        sku: r.sku ?? null
      }));

    const expiringRows = await this.prisma.stockLedger.groupBy({
      by: ["itemId", "batchNo", "lotNo", "expiryDate"],
      where: {
        companyId: user.companyId,
        expiryDate: { not: null, gte: now, lte: expiringCutoff }
      },
      _sum: { qtyIn: true, qtyOut: true }
    });
    const expiringSoon = expiringRows
      .map((row) => {
        const qty = Number(new Prisma.Decimal(row._sum.qtyIn ?? 0).sub(new Prisma.Decimal(row._sum.qtyOut ?? 0)).toString());
        return { ...row, qty };
      })
      .filter((row) => row.qty > 0)
      .slice(0, limit);

    const staleItems = await this.prisma.stockLedger.groupBy({
      by: ["itemId"],
      where: { companyId: user.companyId },
      _max: { date: true }
    });
    const staleSet = new Set(staleItems.filter((r) => !r._max.date || r._max.date < noMovementCutoff).map((r) => r.itemId));
    const noMovement = goods
      .filter((r: any) => staleSet.has(r.id))
      .slice(0, limit)
      .map((r: any) => ({ itemId: r.id, name: r.name, sku: r.sku ?? null }));

    return {
      meta: { expiringWithinDays, noMovementDays },
      counts: {
        belowReorder: belowReorder.length,
        zeroStock: zeroStock.length,
        expiringSoon: expiringSoon.length,
        noMovement: noMovement.length
      },
      belowReorder,
      zeroStock,
      expiringSoon,
      noMovement
    };
  }
}
