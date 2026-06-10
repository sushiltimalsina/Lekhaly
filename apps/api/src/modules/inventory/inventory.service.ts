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

  private async ensureDefaultWarehouse(companyId: string, preferredId?: string | null) {
    if (preferredId) {
      const warehouse = await this.prisma.warehouse.findFirst({
        where: { id: preferredId, companyId, isActive: true }
      });
      if (!warehouse) throw new BadRequestException("Default warehouse not found");
      return warehouse.id;
    }

    const active = await this.prisma.warehouse.findFirst({
      where: { companyId, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    });
    if (active) return active.id;

    const named = await this.prisma.warehouse.findFirst({
      where: { companyId, name: "Main Warehouse" }
    });
    if (named) {
      const updated = await this.prisma.warehouse.update({
        where: { id: named.id },
        data: { isActive: true }
      });
      return updated.id;
    }

    const created = await this.prisma.warehouse.create({
      data: { companyId, name: "Main Warehouse", code: "MAIN", sortOrder: 0 }
    });
    return created.id;
  }

  private async ensureDefaultBin(companyId: string, warehouseId: string) {
    const active = await this.prisma.warehouseBin.findFirst({
      where: { companyId, warehouseId, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    });
    if (active) return active.id;

    const named = await this.prisma.warehouseBin.findFirst({
      where: { companyId, warehouseId, name: "Default Bin" }
    });
    if (named) {
      const updated = await this.prisma.warehouseBin.update({
        where: { id: named.id },
        data: { isActive: true }
      });
      return updated.id;
    }

    const created = await this.prisma.warehouseBin.create({
      data: { companyId, warehouseId, name: "Default Bin", code: "DEFAULT", sortOrder: 0 }
    });
    return created.id;
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

    if (input.inventoryTrackingEnabled === false) {
      next.warehousesEnabled = false;
      next.binsEnabled = false;
      next.batchTrackingEnabled = false;
      next.lotTrackingEnabled = false;
      next.expiryTrackingEnabled = false;
      next.serialTrackingEnabled = false;
      next.kitsEnabled = false;
      next.allowNegativeStock = false;
      next.requireWarehouseOnMovements = false;
      next.defaultWarehouseId = null;
    }
    if (input.warehousesEnabled === false) {
      next.binsEnabled = false;
      next.requireWarehouseOnMovements = false;
      next.defaultWarehouseId = null;
    }
    if (next.inventoryTrackingEnabled && input.warehousesEnabled !== false && (next.binsEnabled || next.requireWarehouseOnMovements || next.defaultWarehouseId)) {
      next.warehousesEnabled = true;
    }
    if (!next.warehousesEnabled) {
      next.binsEnabled = false;
      next.requireWarehouseOnMovements = false;
      next.defaultWarehouseId = null;
    }
    if (!next.inventoryTrackingEnabled) {
      next.warehousesEnabled = false;
      next.binsEnabled = false;
      next.batchTrackingEnabled = false;
      next.lotTrackingEnabled = false;
      next.expiryTrackingEnabled = false;
      next.serialTrackingEnabled = false;
      next.kitsEnabled = false;
      next.allowNegativeStock = false;
      next.requireWarehouseOnMovements = false;
      next.defaultWarehouseId = null;
    }
    if (!next.binsEnabled) {
      next.defaultWarehouseId = next.defaultWarehouseId ?? null;
    }

    await this.assertSettingsCanChange(user.companyId, current, next);

    if (next.inventoryTrackingEnabled && next.warehousesEnabled) {
      next.defaultWarehouseId = await this.ensureDefaultWarehouse(user.companyId, next.defaultWarehouseId);
    }
    if (next.inventoryTrackingEnabled && next.binsEnabled && next.defaultWarehouseId) {
      await this.ensureDefaultBin(user.companyId, next.defaultWarehouseId);
    }

    const saved = await this.prisma.inventorySettings.upsert({
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

    const itemPolicyReset: Prisma.ItemUpdateManyMutationInput = {};
    if (!saved.serialTrackingEnabled) itemPolicyReset.isSerialized = false;
    if (!saved.batchTrackingEnabled) itemPolicyReset.tracksBatch = false;
    if (!saved.lotTrackingEnabled) itemPolicyReset.tracksLot = false;
    if (!saved.expiryTrackingEnabled) itemPolicyReset.tracksExpiry = false;
    if (Object.keys(itemPolicyReset).length > 0) {
      await this.prisma.item.updateMany({
        where: { companyId: user.companyId },
        data: itemPolicyReset
      });
    }

    return saved;
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

  private scopeWhere(scope: {
    warehouseId?: string | null;
    binId?: string | null;
    batchNo?: string | null;
    lotNo?: string | null;
    expiryDate?: Date | null;
  }) {
    const where: Record<string, unknown> = {};
    if (scope.warehouseId !== undefined) where.warehouseId = scope.warehouseId;
    if (scope.binId !== undefined) where.binId = scope.binId;
    if (scope.batchNo) where.batchNo = scope.batchNo;
    if (scope.lotNo) where.lotNo = scope.lotNo;
    if (scope.expiryDate) where.expiryDate = scope.expiryDate;
    return where;
  }

  private async fallbackAverageCost(
    tx: Prisma.TransactionClient,
    companyId: string,
    itemId: string,
    scope: {
      warehouseId?: string | null;
      binId?: string | null;
      batchNo?: string | null;
      lotNo?: string | null;
      expiryDate?: Date | null;
    }
  ) {
    const rows = await tx.stockLedger.findMany({
      where: {
        companyId,
        itemId,
        ...this.scopeWhere(scope)
      },
      select: { qtyIn: true, qtyOut: true, amount: true }
    });
    let qty = new Prisma.Decimal(0);
    let amount = new Prisma.Decimal(0);
    for (const row of rows) {
      qty = qty.add(row.qtyIn).sub(row.qtyOut);
      if (row.qtyIn.gt(0)) amount = amount.add(row.amount);
      if (row.qtyOut.gt(0)) amount = amount.sub(row.amount);
    }
    if (qty.lte(0)) return new Prisma.Decimal(0);
    return amount.gt(0) ? amount.div(qty) : new Prisma.Decimal(0);
  }

  private isMissingInventoryTableError(error: unknown) {
    const err = error as { code?: string; message?: string };
    return err?.code === "P2021" || Boolean(err?.message?.includes("does not exist in the current database"));
  }

  async receiveInventoryLayer(
    tx: Prisma.TransactionClient,
    input: {
      companyId: string;
      itemId: string;
      qty: Prisma.Decimal;
      unitCost: Prisma.Decimal;
      date: Date;
      sourceLedgerId?: string | null;
      sourceVoucherId?: string | null;
      sourceType?: string;
      warehouseId?: string | null;
      binId?: string | null;
      batchNo?: string | null;
      lotNo?: string | null;
      expiryDate?: Date | null;
      expiryDateBs?: string | null;
    }
  ) {
    if (input.qty.lte(0)) return null;
    const db = tx as any;
    if (!db.inventoryLayer) return null;
    try {
      return await db.inventoryLayer.create({
        data: {
          companyId: input.companyId,
          itemId: input.itemId,
          sourceLedgerId: input.sourceLedgerId ?? null,
          sourceVoucherId: input.sourceVoucherId ?? null,
          sourceType: input.sourceType ?? "movement",
          warehouseId: input.warehouseId ?? null,
          binId: input.binId ?? null,
          batchNo: input.batchNo ?? null,
          lotNo: input.lotNo ?? null,
          expiryDate: input.expiryDate ?? null,
          expiryDateBs: input.expiryDateBs ?? null,
          receivedDate: input.date,
          qtyIn: input.qty,
          remainingQty: input.qty,
          unitCost: input.unitCost,
          totalCost: input.qty.mul(input.unitCost)
        }
      });
    } catch (error) {
      if (this.isMissingInventoryTableError(error)) return null;
      throw error;
    }
  }

  async consumeInventoryCost(
    tx: Prisma.TransactionClient,
    input: {
      companyId: string;
      itemId: string;
      qty: Prisma.Decimal;
      costingMethod?: string | null;
      allowNegative?: boolean;
      warehouseId?: string | null;
      binId?: string | null;
      batchNo?: string | null;
      lotNo?: string | null;
      expiryDate?: Date | null;
    }
  ) {
    if (input.qty.lte(0)) return { unitCost: new Prisma.Decimal(0), amount: new Prisma.Decimal(0), consumedQty: new Prisma.Decimal(0) };
    const db = tx as any;
    const where = {
      companyId: input.companyId,
      itemId: input.itemId,
      remainingQty: { gt: new Prisma.Decimal(0) },
      ...this.scopeWhere(input)
    };
    const layers = db.inventoryLayer
      ? await db.inventoryLayer.findMany({
          where,
          orderBy: [
            input.costingMethod === "fifo" ? { receivedDate: "asc" } : { createdAt: "asc" },
            { id: "asc" }
          ]
        }).catch((error: unknown) => {
          if (this.isMissingInventoryTableError(error)) return [];
          throw error;
        })
      : [];

    if (!layers.length) {
      const fallback = await this.fallbackAverageCost(tx, input.companyId, input.itemId, input);
      if (!input.allowNegative) {
        const stock = await tx.stockLedger.aggregate({
          where: { companyId: input.companyId, itemId: input.itemId, ...this.scopeWhere(input) },
          _sum: { qtyIn: true, qtyOut: true }
        });
        const available = new Prisma.Decimal(stock._sum.qtyIn ?? 0).sub(new Prisma.Decimal(stock._sum.qtyOut ?? 0));
        if (available.lt(input.qty)) throw new BadRequestException("Insufficient stock to consume inventory cost");
      }
      return { unitCost: fallback, amount: fallback.mul(input.qty), consumedQty: input.qty };
    }

    const totalQty = layers.reduce((sum: Prisma.Decimal, layer: any) => sum.add(layer.remainingQty), new Prisma.Decimal(0));
    if (totalQty.lt(input.qty) && !input.allowNegative) {
      throw new BadRequestException("Insufficient stock layers to consume inventory cost");
    }
    const weightedCost = totalQty.gt(0)
      ? layers.reduce((sum: Prisma.Decimal, layer: any) => sum.add(layer.remainingQty.mul(layer.unitCost)), new Prisma.Decimal(0)).div(totalQty)
      : new Prisma.Decimal(0);

    let remaining = input.qty;
    let amount = new Prisma.Decimal(0);
    let consumedQty = new Prisma.Decimal(0);
    for (const layer of layers) {
      if (remaining.lte(0)) break;
      const take = layer.remainingQty.gte(remaining) ? remaining : layer.remainingQty;
      const cost = input.costingMethod === "fifo" ? layer.unitCost : weightedCost;
      amount = amount.add(take.mul(cost));
      consumedQty = consumedQty.add(take);
      remaining = remaining.sub(take);
      await db.inventoryLayer.update({
        where: { id: layer.id },
        data: { remainingQty: layer.remainingQty.sub(take) }
      }).catch((error: unknown) => {
        if (this.isMissingInventoryTableError(error)) return null;
        throw error;
      });
    }

    if (remaining.gt(0) && input.allowNegative) {
      const fallback = weightedCost.gt(0) ? weightedCost : await this.fallbackAverageCost(tx, input.companyId, input.itemId, input);
      amount = amount.add(remaining.mul(fallback));
      consumedQty = consumedQty.add(remaining);
      remaining = new Prisma.Decimal(0);
    }

    const unitCost = input.qty.gt(0) ? amount.div(input.qty) : new Prisma.Decimal(0);
    return { unitCost, amount, consumedQty };
  }

  async recordSerialMovements(
    tx: Prisma.TransactionClient,
    input: {
      companyId: string;
      itemId: string;
      serials: Array<{ id: string; serialNo: string; status?: string | null; warehouseId?: string | null; binId?: string | null }>;
      voucherId?: string | null;
      stockLedgerId?: string | null;
      movementType: string;
      statusTo?: string | null;
      toWarehouseId?: string | null;
      toBinId?: string | null;
      movementDate: Date;
      movementDateBs?: string | null;
    }
  ) {
    if (!input.serials.length) return;
    const db = tx as any;
    if (!db.serialNumberMovement) return;
    try {
      await db.serialNumberMovement.createMany({
        data: input.serials.map((serial) => ({
          companyId: input.companyId,
          itemId: input.itemId,
          serialNumberId: serial.id,
          serialNo: serial.serialNo,
          voucherId: input.voucherId ?? null,
          stockLedgerId: input.stockLedgerId ?? null,
          movementType: input.movementType,
          statusFrom: serial.status ?? null,
          statusTo: input.statusTo ?? serial.status ?? null,
          fromWarehouseId: serial.warehouseId ?? null,
          fromBinId: serial.binId ?? null,
          toWarehouseId: input.toWarehouseId ?? null,
          toBinId: input.toBinId ?? null,
          movementDate: input.movementDate,
          movementDateBs: input.movementDateBs ?? null
        }))
      });
    } catch (error) {
      if (this.isMissingInventoryTableError(error)) return;
      throw error;
    }
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
      where: { id: itemId, companyId: user.companyId },
      include: { group: { select: { name: true } } }
    });
    if (!item) throw new BadRequestException("Item not found");
    if ((item as any).type === "services" || (item as any).trackInventory === false) {
      return {
        itemId,
        item: { id: item.id, name: item.name, sku: item.sku, unit: item.unit, group: item.group?.name ?? null },
        qty: 0,
        openingQty: 0,
        openingAmt: 0,
        debitQty: 0,
        debitAmt: 0,
        creditQty: 0,
        creditAmt: 0,
        closingQty: 0,
        closingAmt: 0,
        entries: []
      };
    }

    const where: Prisma.StockLedgerWhereInput = { companyId: user.companyId, itemId, voucherId: { not: null } };
    if (filters.from || filters.to) {
      where.date = {};
      if (filters.from) (where.date as Prisma.DateTimeFilter).gte = filters.from;
      if (filters.to) (where.date as Prisma.DateTimeFilter).lte = filters.to;
    }

    const openingWhere: Prisma.StockLedgerWhereInput = {
      companyId: user.companyId,
      itemId,
      OR: [
        { voucherId: null },
        ...(filters.from ? [{ voucherId: { not: null }, date: { lt: filters.from } }] : [])
      ]
    };

    const ledgerInclude = {
      voucher: {
        select: {
          id: true,
          voucherNumber: true,
          voucherType: true,
          voucherDate: true
        }
      },
      warehouse: { select: { id: true, name: true, code: true } },
      bin: { select: { id: true, name: true, code: true } }
    } satisfies Prisma.StockLedgerInclude;

    const [entries, openingEntries] = await Promise.all([
      this.prisma.stockLedger.findMany({
        where,
        orderBy: [{ date: "asc" }, { createdAt: "asc" }],
        include: ledgerInclude
      }),
      this.prisma.stockLedger.findMany({
        where: openingWhere,
        orderBy: [{ date: "asc" }, { createdAt: "asc" }],
        include: ledgerInclude
      })
    ]);

    let openingQty = new Prisma.Decimal(0);
    let openingAmt = new Prisma.Decimal(0);
    for (const e of openingEntries) {
      openingQty = openingQty.add(e.qtyIn).sub(e.qtyOut);
      if (e.qtyIn.gt(0)) openingAmt = openingAmt.add(e.amount);
      if (e.qtyOut.gt(0)) openingAmt = openingAmt.sub(e.amount);
    }

    let qty = openingQty;
    let amount = openingAmt;
    let debitQty = new Prisma.Decimal(0);
    let debitAmt = new Prisma.Decimal(0);
    let creditQty = new Prisma.Decimal(0);
    let creditAmt = new Prisma.Decimal(0);
    const mappedEntries = [];
    for (const e of entries) {
      if (e.qtyIn.gt(0)) {
        debitQty = debitQty.add(e.qtyIn);
        debitAmt = debitAmt.add(e.amount);
      }
      if (e.qtyOut.gt(0)) {
        creditQty = creditQty.add(e.qtyOut);
        creditAmt = creditAmt.add(e.amount);
      }
      qty = qty.add(e.qtyIn).sub(e.qtyOut);
      amount = amount.add(e.qtyIn.gt(0) ? e.amount : new Prisma.Decimal(0)).sub(e.qtyOut.gt(0) ? e.amount : new Prisma.Decimal(0));
      mappedEntries.push({
        id: e.id,
        date: e.date,
        dateBs: e.dateBs,
        qtyIn: Number(e.qtyIn.toString()),
        qtyOut: Number(e.qtyOut.toString()),
        rate: Number(e.rate.toString()),
        amount: Number(e.amount.toString()),
        debitAmt: e.qtyIn.gt(0) ? Number(e.amount.toString()) : 0,
        creditAmt: e.qtyOut.gt(0) ? Number(e.amount.toString()) : 0,
        runningQty: Number(qty.toString()),
        runningAmt: Number(amount.toString()),
        batchNo: e.batchNo ?? null,
        lotNo: e.lotNo ?? null,
        expiryDate: e.expiryDate ?? null,
        expiryDateBs: e.expiryDateBs ?? null,
        warehouseId: e.warehouseId ?? null,
        warehouseName: e.warehouse?.name ?? null,
        binId: e.binId ?? null,
        binName: e.bin?.name ?? null,
        voucherId: e.voucherId,
        voucherNumber: e.voucher?.voucherNumber ?? null,
        voucherType: e.voucher?.voucherType ?? null,
        voucherDate: e.voucher?.voucherDate ?? null
      });
    }

    return {
      itemId,
      item: { id: item.id, name: item.name, sku: item.sku, unit: item.unit, group: item.group?.name ?? null },
      qty: Number(qty.toString()),
      openingQty: Number(openingQty.toString()),
      openingAmt: Number(openingAmt.toString()),
      debitQty: Number(debitQty.toString()),
      debitAmt: Number(debitAmt.toString()),
      creditQty: Number(creditQty.toString()),
      creditAmt: Number(creditAmt.toString()),
      closingQty: Number(qty.toString()),
      closingAmt: Number(amount.toString()),
      entries: mappedEntries
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
    const enteredRate = new Prisma.Decimal(input.rate ?? 0);
    const enteredAmount = qty.abs().mul(enteredRate);
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
      const cost = qty.lt(0)
        ? await this.consumeInventoryCost(tx, {
            companyId: user.companyId,
            itemId: item.id,
            qty: qty.abs(),
            costingMethod: movement.settings.costingMethod,
            allowNegative: input.allowNegativeOverride || movement.settings.allowNegativeStock,
            warehouseId: movement.warehouseId,
            binId: movement.binId,
            batchNo: input.batchNo || null,
            lotNo: input.lotNo || null,
            expiryDate: input.expiryDate || null
          })
        : { unitCost: enteredRate, amount: enteredAmount };
      const rate = cost.unitCost;
      const amount = cost.amount;

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

      const ledger = await tx.stockLedger.create({
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

      if (qty.gt(0)) {
        await this.receiveInventoryLayer(tx, {
          companyId: user.companyId,
          itemId: item.id,
          qty,
          unitCost: rate,
          date: resolved.date,
          sourceLedgerId: ledger.id,
          sourceVoucherId: voucher.id,
          sourceType: "adjustment",
          warehouseId: movement.warehouseId,
          binId: movement.binId,
          batchNo: input.batchNo || null,
          lotNo: input.lotNo || null,
          expiryDate: input.expiryDate || null,
          expiryDateBs: input.expiryDateBs || null
        });
      }

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
          const createdSerials = await tx.serialNumber.findMany({
            where: {
              companyId: user.companyId,
              itemId: item.id,
              serialNo: { in: serialNumbers }
            },
            select: { id: true, serialNo: true, status: true, warehouseId: true, binId: true }
          });
          await this.recordSerialMovements(tx, {
            companyId: user.companyId,
            itemId: item.id,
            serials: createdSerials,
            voucherId: voucher.id,
            stockLedgerId: ledger.id,
            movementType: "adjustment_in",
            statusTo: "available",
            toWarehouseId: movement.warehouseId,
            toBinId: movement.binId,
            movementDate: resolved.date,
            movementDateBs: resolved.bs || null
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
            select: { id: true, serialNo: true, status: true, warehouseId: true, binId: true }
          });
          if (available.length !== serialNumbers.length) {
            throw new BadRequestException("One or more serial numbers are not available at the selected location");
          }
          await tx.serialNumber.updateMany({
            where: { id: { in: available.map((s) => s.id) } },
            data: { status: "damaged" }
          });
          await this.recordSerialMovements(tx, {
            companyId: user.companyId,
            itemId: item.id,
            serials: available,
            voucherId: voucher.id,
            stockLedgerId: ledger.id,
            movementType: "adjustment_out",
            statusTo: "damaged",
            movementDate: resolved.date,
            movementDateBs: resolved.bs || null
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

    const db = this.prisma as any;
    const useCurrentLayerValuation = !filters.to || filters.to >= new Date(new Date().setHours(0, 0, 0, 0));
    const [periodEntries, openingEntries, openingSeedEntries, reservationRows, layerRows] = await Promise.all([
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
      }),
      useCurrentLayerValuation && db.inventoryLayer
        ? db.inventoryLayer.findMany({
            where: { companyId: user.companyId, remainingQty: { gt: new Prisma.Decimal(0) } },
            select: { itemId: true, remainingQty: true, unitCost: true }
          }).catch((error: unknown) => {
            if (this.isMissingInventoryTableError(error)) return [];
            throw error;
          })
        : Promise.resolve([])
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

    const layerValueByItem = new Map<string, { qty: Prisma.Decimal; amount: Prisma.Decimal }>();
    for (const layer of layerRows as Array<{ itemId: string; remainingQty: Prisma.Decimal; unitCost: Prisma.Decimal }>) {
      const current = layerValueByItem.get(layer.itemId) ?? { qty: zero, amount: zero };
      current.qty = current.qty.add(layer.remainingQty);
      current.amount = current.amount.add(layer.remainingQty.mul(layer.unitCost));
      layerValueByItem.set(layer.itemId, current);
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
          isSerialized: Boolean((item as any).isSerialized),
          isKit: Boolean((item as any).isKit),
          tracksBatch: Boolean((item as any).tracksBatch),
          tracksLot: Boolean((item as any).tracksLot),
          tracksExpiry: Boolean((item as any).tracksExpiry),
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
      const ledgerClosingAmt = s.openAmt.add(s.inAmt).sub(s.outAmt);
      const layerValue = layerValueByItem.get(item.id);
      const closingAmt = useCurrentLayerValuation && layerValue && layerValue.qty.gt(0)
        ? layerValue.amount
        : ledgerClosingAmt;
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
        isSerialized: Boolean((item as any).isSerialized),
        isKit: Boolean((item as any).isKit),
        tracksBatch: Boolean((item as any).tracksBatch),
        tracksLot: Boolean((item as any).tracksLot),
        tracksExpiry: Boolean((item as any).tracksExpiry),
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

  async getStockAgingReport(user: AuthUser, filters: { asOf?: Date; asOfBs?: string; includeZero?: boolean; valuationMethod?: "fifo" | "weighted_average" }) {
    const settings = await this.getOrCreateSettings(user.companyId);
    const asOf = filters.asOf ? new Date(filters.asOf) : new Date();
    asOf.setHours(23, 59, 59, 999);
    const valuationMethod =
      filters.valuationMethod ?? (settings.costingMethod === "moving_average" ? "weighted_average" : "fifo");

    if (!settings.inventoryTrackingEnabled) {
      return {
        meta: { asOf, asOfBs: filters.asOfBs ?? null, valuationMethod, buckets: ["0-30", "31-60", "61-90", "91-180", "181-365", "365+"] },
        rows: []
      };
    }

    const [items, entries] = await Promise.all([
      this.prisma.item.findMany({
        where: {
          companyId: user.companyId,
          type: "goods",
          trackInventory: { not: false }
        },
        orderBy: { name: "asc" },
        include: { group: { select: { name: true } } }
      }),
      this.prisma.stockLedger.findMany({
        where: { companyId: user.companyId, date: { lte: asOf } },
        orderBy: [{ date: "asc" }, { createdAt: "asc" }],
        include: {
          item: { select: { id: true, name: true, sku: true, unit: true } },
          warehouse: { select: { name: true, code: true } },
          bin: { select: { name: true, code: true } }
        }
      })
    ]);

    type BucketKey = "0-30" | "31-60" | "61-90" | "91-180" | "181-365" | "365+";
    type Layer = {
      date: Date;
      dateBs: string | null;
      qty: number;
      value: number;
      rate: number;
      warehouseName: string | null;
      binName: string | null;
      batchNo: string | null;
      lotNo: string | null;
      expiryDate: Date | null;
      expiryDateBs: string | null;
    };

    const bucketKeys: BucketKey[] = ["0-30", "31-60", "61-90", "91-180", "181-365", "365+"];
    const bucketForAge = (ageDays: number): BucketKey => {
      if (ageDays <= 30) return "0-30";
      if (ageDays <= 60) return "31-60";
      if (ageDays <= 90) return "61-90";
      if (ageDays <= 180) return "91-180";
      if (ageDays <= 365) return "181-365";
      return "365+";
    };

    const layersByItem = new Map<string, Layer[]>();
    const getLayers = (itemId: string) => {
      const current = layersByItem.get(itemId);
      if (current) return current;
      const next: Layer[] = [];
      layersByItem.set(itemId, next);
      return next;
    };

    for (const entry of entries) {
      const layers = getLayers(entry.itemId);
      const qtyIn = Number(entry.qtyIn.toString());
      const qtyOut = Number(entry.qtyOut.toString());
      const amount = Number(entry.amount.toString());
      const rate = Number(entry.rate.toString());

      if (qtyIn > 0) {
        layers.push({
          date: entry.date,
          dateBs: entry.dateBs ?? null,
          qty: qtyIn,
          value: amount,
          rate,
          warehouseName: entry.warehouse?.name ?? null,
          binName: entry.bin?.name ?? null,
          batchNo: entry.batchNo ?? null,
          lotNo: entry.lotNo ?? null,
          expiryDate: entry.expiryDate ?? null,
          expiryDateBs: entry.expiryDateBs ?? null
        });
      }

      if (qtyOut > 0) {
        let remainingOut = qtyOut;
        for (const layer of layers) {
          if (remainingOut <= 0) break;
          if (layer.qty <= 0) continue;
          const consumed = Math.min(layer.qty, remainingOut);
          const valuePerUnit = layer.qty === 0 ? 0 : layer.value / layer.qty;
          layer.qty -= consumed;
          layer.value -= consumed * valuePerUnit;
          remainingOut -= consumed;
        }
      }
    }

    const millisPerDay = 24 * 60 * 60 * 1000;
    const rows = items.map((item) => {
      const itemLayers = (layersByItem.get(item.id) ?? []).filter((layer) => layer.qty > 0.000001);
      const fifoTotalQty = itemLayers.reduce((sum, layer) => sum + layer.qty, 0);
      const fifoTotalValue = itemLayers.reduce((sum, layer) => sum + layer.value, 0);
      const weightedAverageRate = fifoTotalQty > 0 ? fifoTotalValue / fifoTotalQty : 0;
      const buckets = bucketKeys.reduce<Record<BucketKey, { qty: number; value: number }>>((acc, key) => {
        acc[key] = { qty: 0, value: 0 };
        return acc;
      }, {} as Record<BucketKey, { qty: number; value: number }>);

      let totalQty = 0;
      let totalValue = 0;
      let weightedAge = 0;
      let oldestAgeDays = 0;

      const layers = itemLayers.map((layer) => {
        const ageDays = Math.max(0, Math.floor((asOf.getTime() - layer.date.getTime()) / millisPerDay));
        const bucket = bucketForAge(ageDays);
        const layerValue = valuationMethod === "weighted_average" ? layer.qty * weightedAverageRate : layer.value;
        buckets[bucket].qty += layer.qty;
        buckets[bucket].value += layerValue;
        totalQty += layer.qty;
        totalValue += layerValue;
        weightedAge += layer.qty * ageDays;
        oldestAgeDays = Math.max(oldestAgeDays, ageDays);
        return {
          date: layer.date,
          dateBs: layer.dateBs,
          ageDays,
          qty: Number(layer.qty.toFixed(2)),
          value: Number(layerValue.toFixed(2)),
          rate: Number((valuationMethod === "weighted_average" ? weightedAverageRate : layer.rate).toFixed(2)),
          warehouseName: layer.warehouseName,
          binName: layer.binName,
          batchNo: layer.batchNo,
          lotNo: layer.lotNo,
          expiryDate: layer.expiryDate,
          expiryDateBs: layer.expiryDateBs
        };
      });

      return {
        itemId: item.id,
        name: item.name,
        sku: item.sku,
        unit: item.unit,
        group: item.group?.name ?? null,
        isSerialized: Boolean((item as any).isSerialized),
        isKit: Boolean((item as any).isKit),
        tracksBatch: Boolean((item as any).tracksBatch),
        tracksLot: Boolean((item as any).tracksLot),
        tracksExpiry: Boolean((item as any).tracksExpiry),
        valuationMethod,
        totalQty: Number(totalQty.toFixed(2)),
        totalValue: Number(totalValue.toFixed(2)),
        avgAgeDays: totalQty > 0 ? Math.round(weightedAge / totalQty) : 0,
        oldestAgeDays,
        buckets: Object.fromEntries(bucketKeys.map((key) => [
          key,
          {
            qty: Number(buckets[key].qty.toFixed(2)),
            value: Number(buckets[key].value.toFixed(2))
          }
        ])),
        layers
      };
    });

    return {
      meta: { asOf, asOfBs: filters.asOfBs ?? null, valuationMethod, buckets: bucketKeys },
      rows: filters.includeZero === false ? rows.filter((row) => row.totalQty > 0) : rows
    };
  }

  async getStockValuationReport(
    user: AuthUser,
    filters: { itemId?: string; warehouseId?: string; groupId?: string; q?: string; includeZero?: boolean }
  ) {
    const settings = await this.getOrCreateSettings(user.companyId);
    if (!settings.inventoryTrackingEnabled) {
      return { meta: { valuationSource: "disabled", costingMethod: settings.costingMethod }, rows: [] };
    }

    const itemWhere: Prisma.ItemWhereInput = {
      companyId: user.companyId,
      type: "goods",
      trackInventory: true
    };
    if (filters.itemId) itemWhere.id = filters.itemId;
    if (filters.groupId) itemWhere.groupId = filters.groupId;
    if (filters.q) {
      itemWhere.OR = [
        { name: { contains: filters.q, mode: "insensitive" } },
        { sku: { contains: filters.q, mode: "insensitive" } }
      ];
    }

    const items = await this.prisma.item.findMany({
      where: itemWhere,
      include: { group: { select: { id: true, name: true } } },
      orderBy: { name: "asc" }
    });
    const itemMap = new Map(items.map((item) => [item.id, item]));
    const itemIds = items.map((item) => item.id);
    if (!itemIds.length) {
      return { meta: { valuationSource: "layers", costingMethod: settings.costingMethod }, rows: [] };
    }

    const db = this.prisma as any;
    const layerRows = db.inventoryLayer
      ? await db.inventoryLayer.findMany({
          where: {
            companyId: user.companyId,
            itemId: { in: itemIds },
            remainingQty: { gt: new Prisma.Decimal(0) },
            ...(filters.warehouseId ? { warehouseId: filters.warehouseId } : {})
          },
          orderBy: [{ receivedDate: "asc" }, { createdAt: "asc" }]
        }).catch((error: unknown) => {
          if (this.isMissingInventoryTableError(error)) return [];
          throw error;
        })
      : [];

    let valuationSource: "layers" | "ledger" = "layers";
    const layersByItem = new Map<string, any[]>();
    if (layerRows.length) {
      for (const layer of layerRows) {
        const list = layersByItem.get(layer.itemId) ?? [];
        list.push(layer);
        layersByItem.set(layer.itemId, list);
      }
    } else {
      valuationSource = "ledger";
      const ledgerRows = await this.prisma.stockLedger.findMany({
        where: {
          companyId: user.companyId,
          itemId: { in: itemIds },
          ...(filters.warehouseId ? { warehouseId: filters.warehouseId } : {})
        },
        include: {
          warehouse: { select: { id: true, name: true } },
          bin: { select: { id: true, name: true } }
        },
        orderBy: [{ date: "asc" }, { createdAt: "asc" }]
      });
      const buckets = new Map<string, any>();
      for (const row of ledgerRows) {
        const key = [
          row.itemId,
          row.warehouseId ?? "",
          row.binId ?? "",
          row.batchNo ?? "",
          row.lotNo ?? "",
          row.expiryDate ? row.expiryDate.toISOString() : ""
        ].join("__");
        const current = buckets.get(key) ?? {
          itemId: row.itemId,
          warehouseId: row.warehouseId,
          warehouse: row.warehouse,
          binId: row.binId,
          bin: row.bin,
          batchNo: row.batchNo,
          lotNo: row.lotNo,
          expiryDate: row.expiryDate,
          expiryDateBs: row.expiryDateBs,
          receivedDate: row.date,
          remainingQty: new Prisma.Decimal(0),
          unitCost: new Prisma.Decimal(0),
          totalValue: new Prisma.Decimal(0)
        };
        current.remainingQty = current.remainingQty.add(row.qtyIn).sub(row.qtyOut);
        if (row.qtyIn.gt(0)) current.totalValue = current.totalValue.add(row.amount);
        if (row.qtyOut.gt(0)) current.totalValue = current.totalValue.sub(row.amount);
        current.unitCost = current.remainingQty.gt(0) ? current.totalValue.div(current.remainingQty) : new Prisma.Decimal(0);
        buckets.set(key, current);
      }
      for (const bucket of buckets.values()) {
        if (bucket.remainingQty.lte(0)) continue;
        const list = layersByItem.get(bucket.itemId) ?? [];
        list.push(bucket);
        layersByItem.set(bucket.itemId, list);
      }
    }

    const rows = items.map((item) => {
      const itemLayers = layersByItem.get(item.id) ?? [];
      const totalQty = itemLayers.reduce((sum, layer) => sum.add(layer.remainingQty), new Prisma.Decimal(0));
      const totalValue = itemLayers.reduce((sum, layer) => {
        const value = layer.totalValue instanceof Prisma.Decimal
          ? layer.totalValue
          : layer.remainingQty.mul(layer.unitCost);
        return sum.add(value);
      }, new Prisma.Decimal(0));
      const avgCost = totalQty.gt(0) ? totalValue.div(totalQty) : new Prisma.Decimal(0);

      return {
        itemId: item.id,
        name: item.name,
        sku: item.sku,
        unit: item.unit,
        group: item.group?.name ?? null,
        isSerialized: Boolean((item as any).isSerialized),
        isKit: Boolean((item as any).isKit),
        tracksBatch: Boolean((item as any).tracksBatch),
        tracksLot: Boolean((item as any).tracksLot),
        tracksExpiry: Boolean((item as any).tracksExpiry),
        totalQty: Number(totalQty.toString()),
        avgCost: Number(avgCost.toFixed(6)),
        totalValue: Number(totalValue.toFixed(2)),
        layers: itemLayers.map((layer) => {
          const qty = new Prisma.Decimal(layer.remainingQty ?? 0);
          const unitCost = new Prisma.Decimal(layer.unitCost ?? 0);
          const value = layer.totalValue instanceof Prisma.Decimal ? layer.totalValue : qty.mul(unitCost);
          return {
            receivedDate: layer.receivedDate,
            warehouseId: layer.warehouseId ?? null,
            warehouseName: layer.warehouse?.name ?? null,
            binId: layer.binId ?? null,
            binName: layer.bin?.name ?? null,
            batchNo: layer.batchNo ?? null,
            lotNo: layer.lotNo ?? null,
            expiryDate: layer.expiryDate ?? null,
            expiryDateBs: layer.expiryDateBs ?? null,
            qty: Number(qty.toString()),
            unitCost: Number(unitCost.toFixed(6)),
            value: Number(value.toFixed(2))
          };
        })
      };
    });

    return {
      meta: {
        valuationSource,
        costingMethod: settings.costingMethod,
        generatedAt: new Date()
      },
      rows: filters.includeZero === false ? rows.filter((row) => row.totalQty > 0) : rows
    };
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
      const transferCost = await this.consumeInventoryCost(tx, {
        companyId: user.companyId,
        itemId: input.itemId,
        qty,
        costingMethod: settings.costingMethod,
        allowNegative: settings.allowNegativeStock,
        warehouseId: input.fromWarehouseId,
        binId: input.fromBinId ?? null,
        batchNo: input.batchNo || null,
        lotNo: input.lotNo || null,
        expiryDate: input.expiryDate || null
      });
      const rate = transferCost.unitCost;
      const amount = transferCost.amount;

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

      const sourceLedger = await tx.stockLedger.create({
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

      const destinationLedger = await tx.stockLedger.create({
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

      await this.receiveInventoryLayer(tx, {
        companyId: user.companyId,
        itemId: input.itemId,
        qty,
        unitCost: rate,
        date: resolved.date,
        sourceLedgerId: destinationLedger.id,
        sourceVoucherId: voucher.id,
        sourceType: "transfer",
        warehouseId: input.toWarehouseId,
        binId: input.toBinId ?? null,
        batchNo: input.batchNo || null,
        lotNo: input.lotNo || null,
        expiryDate: input.expiryDate || null,
        expiryDateBs: input.expiryDateBs || null
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
          select: { id: true, serialNo: true, status: true, warehouseId: true, binId: true }
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
        await this.recordSerialMovements(tx, {
          companyId: user.companyId,
          itemId: input.itemId,
          serials: serialRows,
          voucherId: voucher.id,
          stockLedgerId: sourceLedger.id,
          movementType: "transfer",
          statusTo: "available",
          toWarehouseId: input.toWarehouseId,
          toBinId: input.toBinId ?? null,
          movementDate: resolved.date,
          movementDateBs: resolved.bs || null
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

  async listSerialMovements(
    user: AuthUser,
    query: { itemId?: string; serialNo?: string; voucherId?: string; take?: number }
  ) {
    const db = this.prisma as any;
    if (!db.serialNumberMovement) return [];
    const where: Record<string, unknown> = { companyId: user.companyId };
    if (query.itemId) where.itemId = query.itemId;
    if (query.voucherId) where.voucherId = query.voucherId;
    if (query.serialNo) where.serialNo = { contains: query.serialNo, mode: "insensitive" };
    return db.serialNumberMovement.findMany({
      where,
      orderBy: [{ movementDate: "desc" }, { createdAt: "desc" }],
      take: query.take ?? 200
    }).catch((error: unknown) => {
      if (this.isMissingInventoryTableError(error)) return [];
      throw error;
    });
  }
}
