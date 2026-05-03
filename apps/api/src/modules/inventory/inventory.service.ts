import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma, VoucherStatus, VoucherType } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";
import { resolveAdDate } from "../../common/date/nepali-date";

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateSettings(companyId: string, tx?: Prisma.TransactionClient) {
    const db = (tx ?? this.prisma) as any;
    const existing = await db.inventorySettings.findUnique({ where: { companyId } });
    if (existing) return existing;
    return db.inventorySettings.create({ data: { companyId } });
  }

  async getSettings(user: AuthUser) {
    return this.getOrCreateSettings(user.companyId);
  }

  async updateSettings(user: AuthUser, input: {
    inventoryTrackingEnabled?: boolean;
    warehousesEnabled?: boolean;
    binsEnabled?: boolean;
    batchTrackingEnabled?: boolean;
    lotTrackingEnabled?: boolean;
    expiryTrackingEnabled?: boolean;
    serialTrackingEnabled?: boolean;
    kitsEnabled?: boolean;
    allowNegativeStock?: boolean;
    requireWarehouseOnMovements?: boolean;
    defaultWarehouseId?: string | null;
    costingMethod?: "moving_average" | "fifo";
  }) {
    const current = await this.getOrCreateSettings(user.companyId);
    const next = {
      ...current,
      ...input
    };

    if (!next.warehousesEnabled) {
      next.binsEnabled = false;
      next.requireWarehouseOnMovements = false;
      next.defaultWarehouseId = null;
    }
    if (!next.inventoryTrackingEnabled) {
      next.allowNegativeStock = false;
      next.requireWarehouseOnMovements = false;
    }
    if (!next.binsEnabled) {
      next.defaultWarehouseId = next.defaultWarehouseId ?? null;
    }

    await this.assertSettingsCanChange(user.companyId, current, next);

    if (next.defaultWarehouseId) {
      const warehouse = await this.prisma.warehouse.findFirst({
        where: { id: next.defaultWarehouseId, companyId: user.companyId, isActive: true }
      });
      if (!warehouse) throw new BadRequestException("Default warehouse not found");
    }

    return this.prisma.inventorySettings.upsert({
      where: { companyId: user.companyId },
      create: {
        companyId: user.companyId,
        inventoryTrackingEnabled: next.inventoryTrackingEnabled,
        warehousesEnabled: next.warehousesEnabled,
        binsEnabled: next.binsEnabled,
        batchTrackingEnabled: next.batchTrackingEnabled,
        lotTrackingEnabled: next.lotTrackingEnabled,
        expiryTrackingEnabled: next.expiryTrackingEnabled,
        serialTrackingEnabled: next.serialTrackingEnabled,
        kitsEnabled: next.kitsEnabled,
        allowNegativeStock: next.allowNegativeStock,
        requireWarehouseOnMovements: next.requireWarehouseOnMovements,
        defaultWarehouseId: next.defaultWarehouseId,
        costingMethod: next.costingMethod
      },
      update: {
        inventoryTrackingEnabled: next.inventoryTrackingEnabled,
        warehousesEnabled: next.warehousesEnabled,
        binsEnabled: next.binsEnabled,
        batchTrackingEnabled: next.batchTrackingEnabled,
        lotTrackingEnabled: next.lotTrackingEnabled,
        expiryTrackingEnabled: next.expiryTrackingEnabled,
        serialTrackingEnabled: next.serialTrackingEnabled,
        kitsEnabled: next.kitsEnabled,
        allowNegativeStock: next.allowNegativeStock,
        requireWarehouseOnMovements: next.requireWarehouseOnMovements,
        defaultWarehouseId: next.defaultWarehouseId,
        costingMethod: next.costingMethod
      }
    });
  }

  private async assertSettingsCanChange(companyId: string, current: any, next: any) {
    const guards: Array<[boolean, Promise<number>, string]> = [
      [
        current.warehousesEnabled && !next.warehousesEnabled,
        this.prisma.stockLedger.count({ where: { companyId, warehouseId: { not: null } } }),
        "Warehouses cannot be disabled while warehouse stock movements exist"
      ],
      [
        current.binsEnabled && !next.binsEnabled,
        this.prisma.stockLedger.count({ where: { companyId, binId: { not: null } } }),
        "Bins cannot be disabled while bin stock movements exist"
      ],
      [
        current.batchTrackingEnabled && !next.batchTrackingEnabled,
        this.prisma.stockLedger.count({ where: { companyId, batchNo: { not: null } } }),
        "Batch tracking cannot be disabled while batch stock movements exist"
      ],
      [
        current.lotTrackingEnabled && !next.lotTrackingEnabled,
        this.prisma.stockLedger.count({ where: { companyId, lotNo: { not: null } } }),
        "Lot tracking cannot be disabled while lot stock movements exist"
      ],
      [
        current.expiryTrackingEnabled && !next.expiryTrackingEnabled,
        this.prisma.stockLedger.count({ where: { companyId, expiryDate: { not: null } } }),
        "Expiry tracking cannot be disabled while expiring stock movements exist"
      ],
      [
        current.serialTrackingEnabled && !next.serialTrackingEnabled,
        this.prisma.serialNumber.count({ where: { companyId } }),
        "Serial tracking cannot be disabled while serial numbers exist"
      ],
      [
        current.kitsEnabled && !next.kitsEnabled,
        this.prisma.item.count({ where: { companyId, isKit: true } }),
        "Kits cannot be disabled while kit items exist"
      ]
    ];

    for (const [shouldCheck, countPromise, message] of guards) {
      if (!shouldCheck) continue;
      if ((await countPromise) > 0) throw new BadRequestException(message);
    }
  }

  private normalizeSerialNumbers(serialNumbers?: string[]) {
    const normalized = (serialNumbers ?? []).map((s) => s.trim()).filter(Boolean);
    if (new Set(normalized.map((s) => s.toLowerCase())).size !== normalized.length) {
      throw new BadRequestException("Duplicate serial numbers are not allowed");
    }
    return normalized;
  }

  private assertSerializedQuantity(item: any, qty: Prisma.Decimal, serialNumbers?: string[]) {
    const serials = this.normalizeSerialNumbers(serialNumbers);
    if (!item.isSerialized) {
      if (serials.length) throw new BadRequestException("Serial numbers are only allowed for serialized items");
      return serials;
    }

    const absolute = qty.abs();
    const expected = Number(absolute.toString());
    if (!Number.isInteger(expected)) throw new BadRequestException("Serialized item quantity must be a whole number");
    if (serials.length !== expected) {
      throw new BadRequestException(`Serialized item requires ${expected} serial number(s)`);
    }
    return serials;
  }

  private async applyMovementPolicy(
    companyId: string,
    item: any,
    input: {
      warehouseId?: string | null;
      binId?: string | null;
      batchNo?: string;
      lotNo?: string;
      expiryDate?: Date;
      expiryDateBs?: string;
      serialNumbers?: string[];
    },
    tx?: Prisma.TransactionClient
  ) {
    const settings = await this.getOrCreateSettings(companyId, tx);
    if (!settings.inventoryTrackingEnabled) throw new BadRequestException("Inventory tracking is disabled");
    if ((item as any).type === "services" || item.trackInventory === false) {
      throw new BadRequestException("This item does not track stock");
    }

    if (item.isSerialized && !settings.serialTrackingEnabled) {
      throw new BadRequestException("Enable serial tracking in inventory configuration before using serialized items");
    }
    if (item.isKit && !settings.kitsEnabled) {
      throw new BadRequestException("Enable kits in inventory configuration before using kit items");
    }
    if ((input.batchNo || item.tracksBatch) && !settings.batchTrackingEnabled) {
      throw new BadRequestException("Batch tracking is disabled in inventory configuration");
    }
    if ((input.lotNo || item.tracksLot) && !settings.lotTrackingEnabled) {
      throw new BadRequestException("Lot tracking is disabled in inventory configuration");
    }
    if ((input.expiryDate || input.expiryDateBs || item.tracksExpiry) && !settings.expiryTrackingEnabled) {
      throw new BadRequestException("Expiry tracking is disabled in inventory configuration");
    }

    if (item.tracksBatch && !input.batchNo) throw new BadRequestException("Batch number is required for this item");
    if (item.tracksLot && !input.lotNo) throw new BadRequestException("Lot number is required for this item");
    if (item.tracksExpiry && !input.expiryDate && !input.expiryDateBs) {
      throw new BadRequestException("Expiry date is required for this item");
    }

    const warehouseId = input.warehouseId || settings.defaultWarehouseId || null;
    const binId = input.binId || null;
    if ((warehouseId || settings.requireWarehouseOnMovements) && !settings.warehousesEnabled) {
      throw new BadRequestException("Warehouse tracking is disabled in inventory configuration");
    }
    if (settings.requireWarehouseOnMovements && !warehouseId) {
      throw new BadRequestException("Warehouse is required for stock movements");
    }
    if (binId && !settings.binsEnabled) {
      throw new BadRequestException("Bin tracking is disabled in inventory configuration");
    }

    const db = (tx ?? this.prisma) as any;
    if (warehouseId) {
      const warehouse = await db.warehouse.findFirst({ where: { id: warehouseId, companyId, isActive: true } });
      if (!warehouse) throw new BadRequestException("Warehouse not found");
    }
    if (binId) {
      const bin = await db.warehouseBin.findFirst({ where: { id: binId, companyId, warehouseId, isActive: true } });
      if (!bin) throw new BadRequestException("Bin not found for selected warehouse");
    }

    return { settings, warehouseId, binId };
  }

  async getStock(user: AuthUser, itemId: string, filters: { from?: Date; to?: Date }) {
    const item = await this.prisma.item.findFirst({
      where: { id: itemId, companyId: user.companyId }
    });
    if (!item) throw new BadRequestException("Item not found");
    if ((item as any).type === "services" || (item as any).trackInventory === false) {
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
      warehouseId?: string;
      binId?: string;
      memo?: string;
      batchNo?: string;
      lotNo?: string;
      expiryDate?: Date;
      expiryDateBs?: string;
      serialNumbers?: string[];
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
    const movement = await this.applyMovementPolicy(user.companyId, item, {
      warehouseId: input.warehouseId,
      binId: input.binId,
      batchNo: input.batchNo,
      lotNo: input.lotNo,
      expiryDate: input.expiryDate,
      expiryDateBs: input.expiryDateBs,
      serialNumbers: input.serialNumbers
    });
    const serialNumbers = this.assertSerializedQuantity(item, qty, input.serialNumbers);

    // Negative stock prevention with explicit override scaffold.
    if (qty.lt(0)) {
      const balance = await this.prisma.stockLedger.aggregate({
        where: {
          companyId: user.companyId,
          itemId: item.id,
          warehouseId: movement.warehouseId,
          binId: movement.binId,
          batchNo: input.batchNo || undefined,
          lotNo: input.lotNo || undefined,
          expiryDate: input.expiryDate || undefined
        },
        _sum: { qtyIn: true, qtyOut: true }
      });
      const currentQty = new Prisma.Decimal(balance._sum.qtyIn ?? 0).sub(new Prisma.Decimal(balance._sum.qtyOut ?? 0));
      const projectedQty = currentQty.sub(qty.abs());
      if (projectedQty.lt(0) && !input.allowNegativeOverride && !movement.settings.allowNegativeStock) {
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
          warehouseId: movement.warehouseId,
          binId: movement.binId,
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

      if (serialNumbers.length) {
        if (qty.gt(0)) {
          const existing = await tx.serialNumber.findMany({
            where: { itemId: item.id, serialNo: { in: serialNumbers } },
            select: { serialNo: true }
          });
          if (existing.length) {
            throw new BadRequestException(`Serial number already exists: ${existing[0].serialNo}`);
          }
          await tx.serialNumber.createMany({
            data: serialNumbers.map((serialNo) => ({
              companyId: user.companyId,
              itemId: item.id,
              serialNo,
              warehouseId: movement.warehouseId,
              binId: movement.binId,
              status: "available"
            }))
          });
        } else {
          const available = await tx.serialNumber.findMany({
            where: {
              companyId: user.companyId,
              itemId: item.id,
              serialNo: { in: serialNumbers },
              status: "available",
              warehouseId: movement.warehouseId,
              binId: movement.binId
            },
            select: { id: true }
          });
          if (available.length !== serialNumbers.length) {
            throw new BadRequestException("One or more serial numbers are not available at the selected location");
          }
          await tx.serialNumber.updateMany({
            where: { id: { in: available.map((s) => s.id) } },
            data: { status: "damaged" }
          });
        }
      }

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
      if ((item as any).type === "services" || (item as any).trackInventory === false) {
        return {
          id: item.id,
          name: item.name,
          sku: item.sku,
          hsCode: (item as any).hsCode ?? null,
          unit: item.unit,
          type: (item as any).type ?? "services",
          trackInventory: Boolean((item as any).trackInventory),
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
        trackInventory: Boolean((item as any).trackInventory),
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
      serialNumbers?: string[];
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
    if ((item as any).trackInventory === false) throw new BadRequestException("This item does not track stock");

    const settings = await this.getOrCreateSettings(user.companyId);
    if (!settings.inventoryTrackingEnabled) throw new BadRequestException("Inventory tracking is disabled");
    if (!settings.warehousesEnabled) throw new BadRequestException("Enable warehouses before transferring stock");
    if ((input.fromBinId || input.toBinId) && !settings.binsEnabled) {
      throw new BadRequestException("Bin tracking is disabled in inventory configuration");
    }
    if ((input.batchNo || (item as any).tracksBatch) && !settings.batchTrackingEnabled) {
      throw new BadRequestException("Batch tracking is disabled in inventory configuration");
    }
    if ((input.lotNo || (item as any).tracksLot) && !settings.lotTrackingEnabled) {
      throw new BadRequestException("Lot tracking is disabled in inventory configuration");
    }
    if ((input.expiryDate || input.expiryDateBs || (item as any).tracksExpiry) && !settings.expiryTrackingEnabled) {
      throw new BadRequestException("Expiry tracking is disabled in inventory configuration");
    }
    if ((item as any).isSerialized && !settings.serialTrackingEnabled) {
      throw new BadRequestException("Enable serial tracking in inventory configuration before transferring serialized items");
    }
    if ((item as any).isKit && !settings.kitsEnabled) {
      throw new BadRequestException("Enable kits in inventory configuration before transferring kit items");
    }
    if ((item as any).tracksBatch && !input.batchNo) throw new BadRequestException("Batch number is required for this item");
    if ((item as any).tracksLot && !input.lotNo) throw new BadRequestException("Lot number is required for this item");
    if ((item as any).tracksExpiry && !input.expiryDate && !input.expiryDateBs) {
      throw new BadRequestException("Expiry date is required for this item");
    }

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
    const serialNumbers = this.assertSerializedQuantity(item, qty, input.serialNumbers);

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
    if (sourceQty.lt(qty) && !settings.allowNegativeStock) {
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

      if (serialNumbers.length) {
        const serialRows = await tx.serialNumber.findMany({
          where: {
            companyId: user.companyId,
            itemId: input.itemId,
            serialNo: { in: serialNumbers },
            status: "available",
            warehouseId: input.fromWarehouseId,
            binId: input.fromBinId ?? null
          },
          select: { id: true }
        });
        if (serialRows.length !== serialNumbers.length) {
          throw new BadRequestException("One or more serial numbers are not available at the source location");
        }
        await tx.serialNumber.updateMany({
          where: { id: { in: serialRows.map((s) => s.id) } },
          data: {
            warehouseId: input.toWarehouseId,
            binId: input.toBinId ?? null
          }
        });
      }

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

  async listSerialNumbers(
    user: AuthUser,
    query: { itemId?: string; status?: string; q?: string; take?: number }
  ) {
    const where: Prisma.SerialNumberWhereInput = { companyId: user.companyId };
    if (query.itemId) where.itemId = query.itemId;
    if (query.status) where.status = query.status;
    if (query.q) {
      where.serialNo = { contains: query.q, mode: "insensitive" };
    }
    return this.prisma.serialNumber.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: query.take ?? 200,
      include: {
        item: { select: { id: true, name: true, sku: true } },
        warehouse: { select: { id: true, name: true } },
        bin: { select: { id: true, name: true } }
      }
    });
  }
}
