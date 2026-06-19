"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const nepali_date_1 = require("../../common/date/nepali-date");
let InventoryService = class InventoryService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOrCreateSettings(companyId, tx) {
        const db = (tx ?? this.prisma);
        const existing = await db.inventorySettings.findUnique({ where: { companyId } });
        if (existing)
            return existing;
        return db.inventorySettings.create({ data: { companyId } });
    }
    async getSettings(user) {
        return this.getOrCreateSettings(user.companyId);
    }
    async resolveInventoryAssetAccountId(companyId, item, tx) {
        const db = (tx ?? this.prisma);
        const configuredAccountIds = [item?.expenseAccountId, item?.incomeAccountId].filter(Boolean);
        for (const accountId of configuredAccountIds) {
            const account = await db.chartOfAccount.findFirst({
                where: {
                    id: accountId,
                    companyId,
                    type: "asset",
                    isActive: true,
                    isPostable: true
                },
                select: { id: true }
            });
            if (account?.id)
                return account.id;
        }
        const fallback = await db.chartOfAccount.findFirst({
            where: {
                companyId,
                type: "asset",
                isActive: true,
                isPostable: true,
                OR: [
                    { code: "1130" },
                    { code: "1200" },
                    { name: { contains: "Inventory", mode: "insensitive" } }
                ]
            },
            orderBy: [{ code: "asc" }, { name: "asc" }],
            select: { id: true }
        });
        if (fallback?.id)
            return fallback.id;
        return this.createInventoryAssetAccount(companyId, tx);
    }
    async createInventoryAssetAccount(companyId, tx) {
        const db = (tx ?? this.prisma);
        const currentAssets = await db.chartOfAccount.findFirst({
            where: {
                companyId,
                type: client_1.CoaType.asset,
                isGroup: true,
                OR: [{ code: "1100" }, { name: { contains: "Current Assets", mode: "insensitive" } }]
            },
            orderBy: [{ code: "asc" }],
            select: { id: true, level: true }
        });
        const existing1130 = await db.chartOfAccount.findFirst({
            where: { companyId, code: "1130" },
            select: { id: true, isGroup: true, type: true }
        });
        if (existing1130 && !existing1130.isGroup && existing1130.type === client_1.CoaType.asset) {
            const account = await db.chartOfAccount.update({
                where: { id: existing1130.id },
                data: {
                    name: "Inventory",
                    isActive: true,
                    isPostable: true,
                    parentId: currentAssets?.id ?? null,
                    level: currentAssets ? (currentAssets.level ?? 1) + 1 : 0
                },
                select: { id: true }
            });
            return account.id;
        }
        const code = await this.nextAvailableAccountCode(companyId, "1130", tx);
        const account = await db.chartOfAccount.create({
            data: {
                companyId,
                code,
                name: "Inventory",
                type: client_1.CoaType.asset,
                parentId: currentAssets?.id ?? null,
                isGroup: false,
                isPostable: true,
                isActive: true,
                level: currentAssets ? (currentAssets.level ?? 1) + 1 : 0
            },
            select: { id: true }
        });
        return account.id;
    }
    async nextAvailableAccountCode(companyId, preferredCode, tx) {
        const db = (tx ?? this.prisma);
        for (let offset = 0; offset < 70; offset += 1) {
            const code = String(Number(preferredCode) + offset);
            const exists = await db.chartOfAccount.findFirst({
                where: { companyId, code },
                select: { id: true }
            });
            if (!exists)
                return code;
        }
        throw new common_1.BadRequestException("Could not create Inventory Asset account because no available inventory account code was found.");
    }
    async resolveStockAdjustmentAccountId(companyId, direction, inventoryAccountId, selectedAccountId, tx) {
        const db = (tx ?? this.prisma);
        if (selectedAccountId) {
            const selected = await db.chartOfAccount.findFirst({
                where: { id: selectedAccountId, companyId },
                select: { id: true, isActive: true, isPostable: true }
            });
            if (!selected)
                throw new common_1.BadRequestException("Adjustment account not found");
            if (!selected.isActive || !selected.isPostable) {
                throw new common_1.BadRequestException("Adjustment account must be an active postable account");
            }
            if (selected.id !== inventoryAccountId)
                return selected.id;
        }
        const type = direction === "increase" ? client_1.CoaType.income : client_1.CoaType.expense;
        const name = direction === "increase" ? "Stock Adjustment Gain" : "Inventory Shrinkage / Stock Adjustment Loss";
        const preferredCode = direction === "increase" ? "4210" : "5210";
        const groupName = direction === "increase" ? "Other Income" : "Administrative Expenses";
        const existing = await db.chartOfAccount.findFirst({
            where: {
                companyId,
                type,
                isActive: true,
                isPostable: true,
                OR: [
                    { code: preferredCode },
                    { name: { contains: direction === "increase" ? "Stock Adjustment Gain" : "Inventory Shrinkage", mode: "insensitive" } },
                    { name: { contains: direction === "increase" ? "Adjustment Gain" : "Stock Adjustment Loss", mode: "insensitive" } }
                ]
            },
            orderBy: [{ code: "asc" }, { name: "asc" }],
            select: { id: true }
        });
        if (existing?.id && existing.id !== inventoryAccountId)
            return existing.id;
        const parent = await db.chartOfAccount.findFirst({
            where: {
                companyId,
                type,
                isGroup: true,
                OR: [{ name: { contains: groupName, mode: "insensitive" } }, { code: direction === "increase" ? "4000" : "5000" }]
            },
            orderBy: [{ code: "asc" }],
            select: { id: true, level: true }
        });
        const code = await this.nextAvailableAccountCode(companyId, preferredCode, tx);
        const created = await db.chartOfAccount.create({
            data: {
                companyId,
                code,
                name,
                type,
                parentId: parent?.id ?? null,
                isGroup: false,
                isPostable: true,
                isActive: true,
                level: parent ? (parent.level ?? 0) + 1 : 0
            },
            select: { id: true }
        });
        return created.id;
    }
    async ensureDefaultWarehouse(companyId, preferredId) {
        if (preferredId) {
            const warehouse = await this.prisma.warehouse.findFirst({
                where: { id: preferredId, companyId, isActive: true }
            });
            if (!warehouse)
                throw new common_1.BadRequestException("Default warehouse not found");
            return warehouse.id;
        }
        const active = await this.prisma.warehouse.findFirst({
            where: { companyId, isActive: true },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
        });
        if (active)
            return active.id;
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
    async ensureDefaultBin(companyId, warehouseId) {
        const active = await this.prisma.warehouseBin.findFirst({
            where: { companyId, warehouseId, isActive: true },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
        });
        if (active)
            return active.id;
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
    async updateSettings(user, input) {
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
            next.goodsReceiptWorkflowEnabled = false;
            next.dispatchWorkflowEnabled = false;
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
            next.goodsReceiptWorkflowEnabled = false;
            next.dispatchWorkflowEnabled = false;
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
                goodsReceiptWorkflowEnabled: next.goodsReceiptWorkflowEnabled,
                dispatchWorkflowEnabled: next.dispatchWorkflowEnabled,
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
                goodsReceiptWorkflowEnabled: next.goodsReceiptWorkflowEnabled,
                dispatchWorkflowEnabled: next.dispatchWorkflowEnabled,
                allowNegativeStock: next.allowNegativeStock,
                requireWarehouseOnMovements: next.requireWarehouseOnMovements,
                defaultWarehouseId: next.defaultWarehouseId,
                costingMethod: next.costingMethod
            }
        });
        const itemPolicyReset = {};
        if (!saved.serialTrackingEnabled)
            itemPolicyReset.isSerialized = false;
        if (!saved.batchTrackingEnabled)
            itemPolicyReset.tracksBatch = false;
        if (!saved.lotTrackingEnabled)
            itemPolicyReset.tracksLot = false;
        if (!saved.expiryTrackingEnabled)
            itemPolicyReset.tracksExpiry = false;
        if (Object.keys(itemPolicyReset).length > 0) {
            await this.prisma.item.updateMany({
                where: { companyId: user.companyId },
                data: itemPolicyReset
            });
        }
        return saved;
    }
    async assertSettingsCanChange(companyId, current, next) {
        const guards = [
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
            if (!shouldCheck)
                continue;
            if ((await countPromise) > 0)
                throw new common_1.BadRequestException(message);
        }
    }
    normalizeSerialNumbers(serialNumbers) {
        const normalized = (serialNumbers ?? []).map((s) => s.trim()).filter(Boolean);
        if (new Set(normalized.map((s) => s.toLowerCase())).size !== normalized.length) {
            throw new common_1.BadRequestException("Duplicate serial numbers are not allowed");
        }
        return normalized;
    }
    assertSerializedQuantity(item, qty, serialNumbers) {
        const serials = this.normalizeSerialNumbers(serialNumbers);
        if (!item.isSerialized) {
            if (serials.length)
                throw new common_1.BadRequestException("Serial numbers are only allowed for serialized items");
            return serials;
        }
        const absolute = qty.abs();
        const expected = Number(absolute.toString());
        if (!Number.isInteger(expected))
            throw new common_1.BadRequestException("Serialized item quantity must be a whole number");
        if (serials.length !== expected) {
            throw new common_1.BadRequestException(`Serialized item requires ${expected} serial number(s)`);
        }
        return serials;
    }
    scopeWhere(scope) {
        const where = {};
        if (scope.warehouseId !== undefined)
            where.warehouseId = scope.warehouseId;
        if (scope.binId !== undefined)
            where.binId = scope.binId;
        if (scope.batchNo)
            where.batchNo = scope.batchNo;
        if (scope.lotNo)
            where.lotNo = scope.lotNo;
        if (scope.expiryDate)
            where.expiryDate = scope.expiryDate;
        return where;
    }
    async fallbackAverageCost(tx, companyId, itemId, scope) {
        const rows = await tx.stockLedger.findMany({
            where: {
                companyId,
                itemId,
                ...this.scopeWhere(scope)
            },
            select: { qtyIn: true, qtyOut: true, amount: true }
        });
        let qty = new client_1.Prisma.Decimal(0);
        let amount = new client_1.Prisma.Decimal(0);
        for (const row of rows) {
            qty = qty.add(row.qtyIn).sub(row.qtyOut);
            if (row.qtyIn.gt(0))
                amount = amount.add(row.amount);
            if (row.qtyOut.gt(0))
                amount = amount.sub(row.amount);
        }
        if (qty.lte(0))
            return new client_1.Prisma.Decimal(0);
        return amount.gt(0) ? amount.div(qty) : new client_1.Prisma.Decimal(0);
    }
    isMissingInventoryTableError(error) {
        const err = error;
        return err?.code === "P2021" || Boolean(err?.message?.includes("does not exist in the current database"));
    }
    async receiveInventoryLayer(tx, input) {
        if (input.qty.lte(0))
            return null;
        const db = tx;
        if (!db.inventoryLayer)
            return null;
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
        }
        catch (error) {
            if (this.isMissingInventoryTableError(error))
                return null;
            throw error;
        }
    }
    async consumeInventoryCost(tx, input) {
        if (input.qty.lte(0))
            return { unitCost: new client_1.Prisma.Decimal(0), amount: new client_1.Prisma.Decimal(0), consumedQty: new client_1.Prisma.Decimal(0) };
        const db = tx;
        const where = {
            companyId: input.companyId,
            itemId: input.itemId,
            remainingQty: { gt: new client_1.Prisma.Decimal(0) },
            ...this.scopeWhere(input)
        };
        const layers = db.inventoryLayer
            ? await db.inventoryLayer.findMany({
                where,
                orderBy: [
                    input.costingMethod === "fifo" ? { receivedDate: "asc" } : { createdAt: "asc" },
                    { id: "asc" }
                ]
            }).catch((error) => {
                if (this.isMissingInventoryTableError(error))
                    return [];
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
                const available = new client_1.Prisma.Decimal(stock._sum.qtyIn ?? 0).sub(new client_1.Prisma.Decimal(stock._sum.qtyOut ?? 0));
                if (available.lt(input.qty))
                    throw new common_1.BadRequestException("Insufficient stock to consume inventory cost");
            }
            return { unitCost: fallback, amount: fallback.mul(input.qty), consumedQty: input.qty };
        }
        const totalQty = layers.reduce((sum, layer) => sum.add(layer.remainingQty), new client_1.Prisma.Decimal(0));
        if (totalQty.lt(input.qty) && !input.allowNegative) {
            throw new common_1.BadRequestException("Insufficient stock layers to consume inventory cost");
        }
        const weightedCost = totalQty.gt(0)
            ? layers.reduce((sum, layer) => sum.add(layer.remainingQty.mul(layer.unitCost)), new client_1.Prisma.Decimal(0)).div(totalQty)
            : new client_1.Prisma.Decimal(0);
        let remaining = input.qty;
        let amount = new client_1.Prisma.Decimal(0);
        let consumedQty = new client_1.Prisma.Decimal(0);
        for (const layer of layers) {
            if (remaining.lte(0))
                break;
            const take = layer.remainingQty.gte(remaining) ? remaining : layer.remainingQty;
            const cost = input.costingMethod === "fifo" ? layer.unitCost : weightedCost;
            amount = amount.add(take.mul(cost));
            consumedQty = consumedQty.add(take);
            remaining = remaining.sub(take);
            await db.inventoryLayer.update({
                where: { id: layer.id },
                data: { remainingQty: layer.remainingQty.sub(take) }
            }).catch((error) => {
                if (this.isMissingInventoryTableError(error))
                    return null;
                throw error;
            });
        }
        if (remaining.gt(0) && input.allowNegative) {
            const fallback = weightedCost.gt(0) ? weightedCost : await this.fallbackAverageCost(tx, input.companyId, input.itemId, input);
            amount = amount.add(remaining.mul(fallback));
            consumedQty = consumedQty.add(remaining);
            remaining = new client_1.Prisma.Decimal(0);
        }
        const unitCost = input.qty.gt(0) ? amount.div(input.qty) : new client_1.Prisma.Decimal(0);
        return { unitCost, amount, consumedQty };
    }
    async recordSerialMovements(tx, input) {
        if (!input.serials.length)
            return;
        const db = tx;
        if (!db.serialNumberMovement)
            return;
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
        }
        catch (error) {
            if (this.isMissingInventoryTableError(error))
                return;
            throw error;
        }
    }
    async applyMovementPolicy(companyId, item, input, tx) {
        const settings = await this.getOrCreateSettings(companyId, tx);
        if (!settings.inventoryTrackingEnabled)
            throw new common_1.BadRequestException("Inventory tracking is disabled");
        if (item.type === "services" || item.trackInventory === false) {
            throw new common_1.BadRequestException("This item does not track stock");
        }
        if (item.isSerialized && !settings.serialTrackingEnabled) {
            throw new common_1.BadRequestException("Enable serial tracking in inventory configuration before using serialized items");
        }
        if (item.isKit && !settings.kitsEnabled) {
            throw new common_1.BadRequestException("Enable kits in inventory configuration before using kit items");
        }
        if ((input.batchNo || item.tracksBatch) && !settings.batchTrackingEnabled) {
            throw new common_1.BadRequestException("Batch tracking is disabled in inventory configuration");
        }
        if ((input.lotNo || item.tracksLot) && !settings.lotTrackingEnabled) {
            throw new common_1.BadRequestException("Lot tracking is disabled in inventory configuration");
        }
        if ((input.expiryDate || input.expiryDateBs || item.tracksExpiry) && !settings.expiryTrackingEnabled) {
            throw new common_1.BadRequestException("Expiry tracking is disabled in inventory configuration");
        }
        if (item.tracksBatch && !input.batchNo)
            throw new common_1.BadRequestException("Batch number is required for this item");
        if (item.tracksLot && !input.lotNo)
            throw new common_1.BadRequestException("Lot number is required for this item");
        if (item.tracksExpiry && !input.expiryDate && !input.expiryDateBs) {
            throw new common_1.BadRequestException("Expiry date is required for this item");
        }
        const warehouseId = input.warehouseId || settings.defaultWarehouseId || null;
        const binId = input.binId || null;
        if ((warehouseId || settings.requireWarehouseOnMovements) && !settings.warehousesEnabled) {
            throw new common_1.BadRequestException("Warehouse tracking is disabled in inventory configuration");
        }
        if (settings.requireWarehouseOnMovements && !warehouseId) {
            throw new common_1.BadRequestException("Warehouse is required for stock movements");
        }
        if (binId && !settings.binsEnabled) {
            throw new common_1.BadRequestException("Bin tracking is disabled in inventory configuration");
        }
        const db = (tx ?? this.prisma);
        if (warehouseId) {
            const warehouse = await db.warehouse.findFirst({ where: { id: warehouseId, companyId, isActive: true } });
            if (!warehouse)
                throw new common_1.BadRequestException("Warehouse not found");
        }
        if (binId) {
            const bin = await db.warehouseBin.findFirst({ where: { id: binId, companyId, warehouseId, isActive: true } });
            if (!bin)
                throw new common_1.BadRequestException("Bin not found for selected warehouse");
        }
        return { settings, warehouseId, binId };
    }
    async getStock(user, itemId, filters) {
        const item = await this.prisma.item.findFirst({
            where: { id: itemId, companyId: user.companyId },
            include: { group: { select: { name: true } } }
        });
        if (!item)
            throw new common_1.BadRequestException("Item not found");
        if (item.type === "services" || item.trackInventory === false) {
            return {
                itemId,
                item: {
                    id: item.id,
                    name: item.name,
                    sku: item.sku,
                    unit: item.unit,
                    group: item.group?.name ?? null,
                    isSerialized: Boolean(item.isSerialized),
                    tracksBatch: Boolean(item.tracksBatch),
                    tracksLot: Boolean(item.tracksLot),
                    tracksExpiry: Boolean(item.tracksExpiry)
                },
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
        const where = { companyId: user.companyId, itemId, voucherId: { not: null } };
        if (filters.from || filters.to) {
            where.date = {};
            if (filters.from)
                where.date.gte = filters.from;
            if (filters.to)
                where.date.lte = filters.to;
        }
        const openingWhere = {
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
                    voucherDate: true,
                    party: { select: { id: true, name: true } },
                    invoice: {
                        select: {
                            id: true,
                            invoiceNo: true,
                            type: true,
                            party: { select: { id: true, name: true } }
                        }
                    }
                }
            },
            warehouse: { select: { id: true, name: true, code: true } },
            bin: { select: { id: true, name: true, code: true } }
        };
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
        let openingQty = new client_1.Prisma.Decimal(0);
        let openingAmt = new client_1.Prisma.Decimal(0);
        for (const e of openingEntries) {
            openingQty = openingQty.add(e.qtyIn).sub(e.qtyOut);
            if (e.qtyIn.gt(0))
                openingAmt = openingAmt.add(e.amount);
            if (e.qtyOut.gt(0))
                openingAmt = openingAmt.sub(e.amount);
        }
        let qty = openingQty;
        let amount = openingAmt;
        let debitQty = new client_1.Prisma.Decimal(0);
        let debitAmt = new client_1.Prisma.Decimal(0);
        let creditQty = new client_1.Prisma.Decimal(0);
        let creditAmt = new client_1.Prisma.Decimal(0);
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
            amount = amount.add(e.qtyIn.gt(0) ? e.amount : new client_1.Prisma.Decimal(0)).sub(e.qtyOut.gt(0) ? e.amount : new client_1.Prisma.Decimal(0));
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
                voucherDate: e.voucher?.voucherDate ?? null,
                invoiceId: e.voucher?.invoice?.id ?? null,
                invoiceNumber: e.voucher?.invoice?.invoiceNo ?? null,
                invoiceType: e.voucher?.invoice?.type ?? null,
                partyId: e.voucher?.invoice?.party?.id ?? e.voucher?.party?.id ?? null,
                partyName: e.voucher?.invoice?.party?.name ?? e.voucher?.party?.name ?? null,
                sourceDocumentType: e.sourceDocumentType ?? null,
                sourceDocumentId: e.sourceDocumentId ?? null
            });
        }
        return {
            itemId,
            item: {
                id: item.id,
                name: item.name,
                sku: item.sku,
                unit: item.unit,
                group: item.group?.name ?? null,
                isSerialized: Boolean(item.isSerialized),
                tracksBatch: Boolean(item.tracksBatch),
                tracksLot: Boolean(item.tracksLot),
                tracksExpiry: Boolean(item.tracksExpiry)
            },
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
    async adjustStock(user, input) {
        const item = await this.prisma.item.findFirst({
            where: { id: input.itemId, companyId: user.companyId }
        });
        if (!item)
            throw new common_1.BadRequestException("Item not found");
        if (item.type === "services") {
            throw new common_1.BadRequestException("Service items do not track stock");
        }
        const inventoryAccountId = await this.resolveInventoryAssetAccountId(user.companyId, item);
        const qty = new client_1.Prisma.Decimal(input.qty);
        if (qty.equals(0))
            throw new common_1.BadRequestException("Quantity cannot be zero");
        const adjustmentAccountId = await this.resolveStockAdjustmentAccountId(user.companyId, qty.gt(0) ? "increase" : "decrease", inventoryAccountId, input.accountId);
        const enteredRate = new client_1.Prisma.Decimal(input.rate ?? 0);
        if (qty.gt(0) && enteredRate.lte(0)) {
            throw new common_1.BadRequestException("Rate is required for stock increases so inventory value and accounting remain correct");
        }
        const enteredAmount = qty.abs().mul(enteredRate);
        const resolved = (0, nepali_date_1.resolveAdDate)(input.date, input.dateBs);
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
            const currentQty = new client_1.Prisma.Decimal(balance._sum.qtyIn ?? 0).sub(new client_1.Prisma.Decimal(balance._sum.qtyOut ?? 0));
            const projectedQty = currentQty.sub(qty.abs());
            if (projectedQty.lt(0) && !input.allowNegativeOverride && !movement.settings.allowNegativeStock) {
                throw new common_1.BadRequestException(`Negative stock not allowed for "${item.name}". Current: ${currentQty.toString()}, Requested out: ${qty.abs().toString()}.`);
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
                    voucherType: client_1.VoucherType.journal,
                    status: client_1.VoucherStatus.posted,
                    voucherDate: resolved.date,
                    voucherDateBs: resolved.bs || null,
                    memo: input.memo ||
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
                                    credit: new client_1.Prisma.Decimal(0),
                                    description: "Stock increase"
                                },
                                {
                                    companyId: user.companyId,
                                    lineNo: 2,
                                    accountId: adjustmentAccountId,
                                    debit: new client_1.Prisma.Decimal(0),
                                    credit: amount,
                                    description: "Stock increase offset"
                                }
                            ]
                            : [
                                {
                                    companyId: user.companyId,
                                    lineNo: 1,
                                    accountId: adjustmentAccountId,
                                    debit: amount,
                                    credit: new client_1.Prisma.Decimal(0),
                                    description: "Stock decrease / shrinkage loss"
                                },
                                {
                                    companyId: user.companyId,
                                    lineNo: 2,
                                    accountId: inventoryAccountId,
                                    debit: new client_1.Prisma.Decimal(0),
                                    credit: amount,
                                    description: "Inventory asset reduction"
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
                    sourceDocumentType: "adjustment",
                    sourceDocumentId: voucher.id,
                    warehouseId: movement.warehouseId,
                    binId: movement.binId,
                    qtyIn: qty.gt(0) ? qty : new client_1.Prisma.Decimal(0),
                    qtyOut: qty.lt(0) ? qty.abs() : new client_1.Prisma.Decimal(0),
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
                        throw new common_1.BadRequestException(`Serial number already exists: ${existing[0].serialNo}`);
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
                }
                else {
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
                        throw new common_1.BadRequestException("One or more serial numbers are not available at the selected location");
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
    async getStockReport(user, filters) {
        const items = await this.prisma.item.findMany({
            where: { companyId: user.companyId },
            orderBy: { name: "asc" },
            include: {
                incomeAccount: { select: { name: true } },
                expenseAccount: { select: { name: true } },
                group: { select: { name: true } }
            }
        });
        const periodWhere = { companyId: user.companyId };
        if (filters.from || filters.to) {
            periodWhere.date = {};
            if (filters.from)
                periodWhere.date.gte = filters.from;
            if (filters.to)
                periodWhere.date.lte = filters.to;
        }
        const openingWhere = filters.from
            ? { companyId: user.companyId, date: { lt: filters.from }, voucherId: { not: null } }
            : null;
        const db = this.prisma;
        const useCurrentLayerValuation = !filters.to || filters.to >= new Date(new Date().setHours(0, 0, 0, 0));
        const reservationPromise = db.stockReservation
            ? db.stockReservation.findMany({
                where: { companyId: user.companyId, status: { in: ["active", "partial"] } },
                select: { itemId: true, reservedQty: true, releasedQty: true, fulfilledQty: true }
            }).catch((error) => {
                if (this.isMissingInventoryTableError(error))
                    return null;
                throw error;
            })
            : Promise.resolve(null);
        const [periodEntries, openingEntries, openingSeedEntries, reservationRows, fallbackReservationRows, openPurchaseLines, layerRows] = await Promise.all([
            this.prisma.stockLedger.findMany({ where: periodWhere }),
            openingWhere ? this.prisma.stockLedger.findMany({ where: openingWhere }) : Promise.resolve([]),
            this.prisma.stockLedger.findMany({
                where: { companyId: user.companyId, voucherId: null }
            }),
            reservationPromise,
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
            this.prisma.purchaseOrderItem.findMany({
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
                    receivedQty: true
                }
            }),
            useCurrentLayerValuation && db.inventoryLayer
                ? db.inventoryLayer.findMany({
                    where: { companyId: user.companyId, remainingQty: { gt: new client_1.Prisma.Decimal(0) } },
                    select: { itemId: true, remainingQty: true, unitCost: true }
                }).catch((error) => {
                    if (this.isMissingInventoryTableError(error))
                        return [];
                    throw error;
                })
                : Promise.resolve([])
        ]);
        const zero = new client_1.Prisma.Decimal(0);
        const reservedByItem = new Map();
        if (Array.isArray(reservationRows)) {
            for (const row of reservationRows) {
                const reserved = row.reservedQty.sub(row.releasedQty).sub(row.fulfilledQty);
                if (reserved.lte(0))
                    continue;
                const prev = reservedByItem.get(row.itemId) ?? zero;
                reservedByItem.set(row.itemId, prev.add(reserved));
            }
        }
        else {
            for (const row of fallbackReservationRows) {
                const itemId = row.itemId;
                if (!itemId)
                    continue;
                const pending = row.qty.sub(row.fulfilledQty);
                if (pending.lte(0))
                    continue;
                const prev = reservedByItem.get(itemId) ?? zero;
                reservedByItem.set(itemId, prev.add(pending));
            }
        }
        const pendingPurchaseQtyByItem = new Map();
        for (const row of openPurchaseLines) {
            if (!row.itemId)
                continue;
            const pending = Math.max(Number(row.qty ?? 0) - Number(row.receivedQty ?? 0), 0);
            if (pending <= 0)
                continue;
            pendingPurchaseQtyByItem.set(row.itemId, (pendingPurchaseQtyByItem.get(row.itemId) ?? 0) + pending);
        }
        const layerValueByItem = new Map();
        for (const layer of layerRows) {
            const current = layerValueByItem.get(layer.itemId) ?? { qty: zero, amount: zero };
            current.qty = current.qty.add(layer.remainingQty);
            current.amount = current.amount.add(layer.remainingQty.mul(layer.unitCost));
            layerValueByItem.set(layer.itemId, current);
        }
        const stats = new Map();
        const getStats = (itemId) => {
            const current = stats.get(itemId);
            if (current)
                return current;
            const next = { openQty: zero, openAmt: zero, inQty: zero, inAmt: zero, outQty: zero, outAmt: zero };
            stats.set(itemId, next);
            return next;
        };
        for (const e of openingEntries) {
            const s = getStats(e.itemId);
            s.openQty = s.openQty.add(e.qtyIn).sub(e.qtyOut);
            if (e.qtyIn.gt(0))
                s.openAmt = s.openAmt.add(e.amount);
            if (e.qtyOut.gt(0))
                s.openAmt = s.openAmt.sub(e.amount);
        }
        for (const e of openingSeedEntries) {
            const s = getStats(e.itemId);
            s.openQty = s.openQty.add(e.qtyIn).sub(e.qtyOut);
            if (e.qtyIn.gt(0))
                s.openAmt = s.openAmt.add(e.amount);
            if (e.qtyOut.gt(0))
                s.openAmt = s.openAmt.sub(e.amount);
        }
        for (const e of periodEntries) {
            if (!e.voucherId)
                continue;
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
            if (item.type === "services" || item.trackInventory === false) {
                const reorderLevel = Number(item.reorderLevel ?? 0);
                const safetyStock = Number(item.safetyStock ?? 0);
                const minStockLevel = Number(item.minStockLevel ?? 0);
                const reorderQty = Number(item.reorderQty ?? 0);
                const reorderThreshold = Math.max(reorderLevel, safetyStock, minStockLevel);
                return {
                    id: item.id,
                    name: item.name,
                    sku: item.sku,
                    hsCode: item.hsCode ?? null,
                    unit: item.unit,
                    type: item.type ?? "services",
                    trackInventory: Boolean(item.trackInventory),
                    isSerialized: Boolean(item.isSerialized),
                    isKit: Boolean(item.isKit),
                    tracksBatch: Boolean(item.tracksBatch),
                    tracksLot: Boolean(item.tracksLot),
                    tracksExpiry: Boolean(item.tracksExpiry),
                    defaultWarehouseId: item.defaultWarehouseId ?? null,
                    defaultBinId: item.defaultBinId ?? null,
                    defaultBatchNo: item.defaultBatchNo ?? null,
                    defaultLotNo: item.defaultLotNo ?? null,
                    defaultExpiryDate: item.defaultExpiryDate ?? null,
                    defaultExpiryDateBs: item.defaultExpiryDateBs ?? null,
                    parentGroup: item.group?.name ?? item.incomeAccount?.name ?? item.expenseAccount?.name ?? "—",
                    reorderLevel,
                    safetyStock,
                    minStockLevel,
                    reorderQty,
                    onHandQty: 0,
                    reservedQty: 0,
                    availableQty: 0,
                    pendingPurchaseQty: 0,
                    effectiveAvailableQty: 0,
                    reorderThreshold,
                    shortageQty: 0,
                    suggestedQty: 0,
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
            const reorderLevel = Number(item.reorderLevel ?? 0);
            const safetyStock = Number(item.safetyStock ?? 0);
            const minStockLevel = Number(item.minStockLevel ?? 0);
            const reorderQty = Number(item.reorderQty ?? 0);
            const onHandQty = Number(closingQty.toString());
            const reservedQty = Number((reservedByItem.get(item.id) ?? zero).toString());
            const availableQty = onHandQty - reservedQty;
            const pendingPurchaseQty = pendingPurchaseQtyByItem.get(item.id) ?? 0;
            const effectiveAvailableQty = availableQty + pendingPurchaseQty;
            const reorderThreshold = Math.max(reorderLevel, safetyStock, minStockLevel);
            const isLowStock = effectiveAvailableQty <= reorderThreshold;
            const shortageQty = Math.max(reorderThreshold - effectiveAvailableQty, 0);
            const suggestedQty = isLowStock
                ? (reorderQty > 0 ? reorderQty : Math.max(shortageQty, effectiveAvailableQty <= 0 ? 1 : 0))
                : 0;
            const opAvg = s.openQty.equals(0) ? zero : s.openAmt.div(s.openQty);
            const inAvg = s.inQty.equals(0) ? zero : s.inAmt.div(s.inQty);
            const outAvg = s.outQty.equals(0) ? zero : s.outAmt.div(s.outQty);
            const closingPrice = closingQty.equals(0) ? zero : closingAmt.div(closingQty);
            return {
                id: item.id,
                name: item.name,
                sku: item.sku,
                hsCode: item.hsCode ?? null,
                unit: item.unit,
                type: item.type ?? "goods",
                trackInventory: Boolean(item.trackInventory),
                isSerialized: Boolean(item.isSerialized),
                isKit: Boolean(item.isKit),
                tracksBatch: Boolean(item.tracksBatch),
                tracksLot: Boolean(item.tracksLot),
                tracksExpiry: Boolean(item.tracksExpiry),
                defaultWarehouseId: item.defaultWarehouseId ?? null,
                defaultBinId: item.defaultBinId ?? null,
                defaultBatchNo: item.defaultBatchNo ?? null,
                defaultLotNo: item.defaultLotNo ?? null,
                defaultExpiryDate: item.defaultExpiryDate ?? null,
                defaultExpiryDateBs: item.defaultExpiryDateBs ?? null,
                parentGroup: item.group?.name ?? item.incomeAccount?.name ?? item.expenseAccount?.name ?? "—",
                reorderLevel,
                safetyStock,
                minStockLevel,
                reorderQty,
                onHandQty,
                reservedQty,
                availableQty,
                pendingPurchaseQty,
                effectiveAvailableQty,
                reorderThreshold,
                shortageQty,
                suggestedQty,
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
    async getStockAgingReport(user, filters) {
        const settings = await this.getOrCreateSettings(user.companyId);
        const asOf = filters.asOf ? new Date(filters.asOf) : new Date();
        asOf.setHours(23, 59, 59, 999);
        const valuationMethod = filters.valuationMethod ?? (settings.costingMethod === "moving_average" ? "weighted_average" : "fifo");
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
        const bucketKeys = ["0-30", "31-60", "61-90", "91-180", "181-365", "365+"];
        const bucketForAge = (ageDays) => {
            if (ageDays <= 30)
                return "0-30";
            if (ageDays <= 60)
                return "31-60";
            if (ageDays <= 90)
                return "61-90";
            if (ageDays <= 180)
                return "91-180";
            if (ageDays <= 365)
                return "181-365";
            return "365+";
        };
        const layersByItem = new Map();
        const getLayers = (itemId) => {
            const current = layersByItem.get(itemId);
            if (current)
                return current;
            const next = [];
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
                    if (remainingOut <= 0)
                        break;
                    if (layer.qty <= 0)
                        continue;
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
            const buckets = bucketKeys.reduce((acc, key) => {
                acc[key] = { qty: 0, value: 0 };
                return acc;
            }, {});
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
                isSerialized: Boolean(item.isSerialized),
                isKit: Boolean(item.isKit),
                tracksBatch: Boolean(item.tracksBatch),
                tracksLot: Boolean(item.tracksLot),
                tracksExpiry: Boolean(item.tracksExpiry),
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
    async getStockValuationReport(user, filters) {
        const settings = await this.getOrCreateSettings(user.companyId);
        if (!settings.inventoryTrackingEnabled) {
            return { meta: { valuationSource: "disabled", costingMethod: settings.costingMethod }, rows: [] };
        }
        const itemWhere = {
            companyId: user.companyId,
            type: "goods",
            trackInventory: true
        };
        if (filters.itemId)
            itemWhere.id = filters.itemId;
        if (filters.groupId)
            itemWhere.groupId = filters.groupId;
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
        const db = this.prisma;
        const layerRows = db.inventoryLayer
            ? await db.inventoryLayer.findMany({
                where: {
                    companyId: user.companyId,
                    itemId: { in: itemIds },
                    remainingQty: { gt: new client_1.Prisma.Decimal(0) },
                    ...(filters.warehouseId ? { warehouseId: filters.warehouseId } : {}),
                    ...(filters.binId ? { binId: filters.binId } : {})
                },
                orderBy: [{ receivedDate: "asc" }, { createdAt: "asc" }]
            }).catch((error) => {
                if (this.isMissingInventoryTableError(error))
                    return [];
                throw error;
            })
            : [];
        let valuationSource = "layers";
        const layersByItem = new Map();
        if (layerRows.length) {
            for (const layer of layerRows) {
                const list = layersByItem.get(layer.itemId) ?? [];
                list.push(layer);
                layersByItem.set(layer.itemId, list);
            }
        }
        else {
            valuationSource = "ledger";
            const ledgerRows = await this.prisma.stockLedger.findMany({
                where: {
                    companyId: user.companyId,
                    itemId: { in: itemIds },
                    ...(filters.warehouseId ? { warehouseId: filters.warehouseId } : {}),
                    ...(filters.binId ? { binId: filters.binId } : {})
                },
                include: {
                    warehouse: { select: { id: true, name: true } },
                    bin: { select: { id: true, name: true } }
                },
                orderBy: [{ date: "asc" }, { createdAt: "asc" }]
            });
            const buckets = new Map();
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
                    remainingQty: new client_1.Prisma.Decimal(0),
                    unitCost: new client_1.Prisma.Decimal(0),
                    totalValue: new client_1.Prisma.Decimal(0)
                };
                current.remainingQty = current.remainingQty.add(row.qtyIn).sub(row.qtyOut);
                if (row.qtyIn.gt(0))
                    current.totalValue = current.totalValue.add(row.amount);
                if (row.qtyOut.gt(0))
                    current.totalValue = current.totalValue.sub(row.amount);
                current.unitCost = current.remainingQty.gt(0) ? current.totalValue.div(current.remainingQty) : new client_1.Prisma.Decimal(0);
                buckets.set(key, current);
            }
            for (const bucket of buckets.values()) {
                if (bucket.remainingQty.lte(0))
                    continue;
                const list = layersByItem.get(bucket.itemId) ?? [];
                list.push(bucket);
                layersByItem.set(bucket.itemId, list);
            }
        }
        const locationIds = {
            warehouseIds: Array.from(new Set(Array.from(layersByItem.values()).flat().map((layer) => layer.warehouseId).filter(Boolean))),
            binIds: Array.from(new Set(Array.from(layersByItem.values()).flat().map((layer) => layer.binId).filter(Boolean)))
        };
        const [warehouseRows, binRows] = await Promise.all([
            locationIds.warehouseIds.length
                ? this.prisma.warehouse.findMany({ where: { companyId: user.companyId, id: { in: locationIds.warehouseIds } }, select: { id: true, name: true } })
                : Promise.resolve([]),
            locationIds.binIds.length
                ? this.prisma.warehouseBin.findMany({ where: { companyId: user.companyId, id: { in: locationIds.binIds } }, select: { id: true, name: true } })
                : Promise.resolve([])
        ]);
        const warehouseNameById = new Map(warehouseRows.map((warehouse) => [warehouse.id, warehouse.name]));
        const binNameById = new Map(binRows.map((bin) => [bin.id, bin.name]));
        const rows = items.map((item) => {
            const itemLayers = layersByItem.get(item.id) ?? [];
            const totalQty = itemLayers.reduce((sum, layer) => sum.add(layer.remainingQty), new client_1.Prisma.Decimal(0));
            const totalValue = itemLayers.reduce((sum, layer) => {
                const value = layer.totalValue instanceof client_1.Prisma.Decimal
                    ? layer.totalValue
                    : layer.remainingQty.mul(layer.unitCost);
                return sum.add(value);
            }, new client_1.Prisma.Decimal(0));
            const avgCost = totalQty.gt(0) ? totalValue.div(totalQty) : new client_1.Prisma.Decimal(0);
            return {
                itemId: item.id,
                name: item.name,
                sku: item.sku,
                unit: item.unit,
                group: item.group?.name ?? null,
                isSerialized: Boolean(item.isSerialized),
                isKit: Boolean(item.isKit),
                tracksBatch: Boolean(item.tracksBatch),
                tracksLot: Boolean(item.tracksLot),
                tracksExpiry: Boolean(item.tracksExpiry),
                totalQty: Number(totalQty.toString()),
                avgCost: Number(avgCost.toFixed(6)),
                totalValue: Number(totalValue.toFixed(2)),
                layers: itemLayers.map((layer) => {
                    const qty = new client_1.Prisma.Decimal(layer.remainingQty ?? 0);
                    const unitCost = new client_1.Prisma.Decimal(layer.unitCost ?? 0);
                    const value = layer.totalValue instanceof client_1.Prisma.Decimal ? layer.totalValue : qty.mul(unitCost);
                    return {
                        receivedDate: layer.receivedDate,
                        warehouseId: layer.warehouseId ?? null,
                        warehouseName: layer.warehouse?.name ?? (layer.warehouseId ? warehouseNameById.get(layer.warehouseId) ?? null : null),
                        binId: layer.binId ?? null,
                        binName: layer.bin?.name ?? (layer.binId ? binNameById.get(layer.binId) ?? null : null),
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
    async transferStock(user, input) {
        const item = await this.prisma.item.findFirst({
            where: { id: input.itemId, companyId: user.companyId }
        });
        if (!item)
            throw new common_1.BadRequestException("Item not found");
        if (item.type === "services")
            throw new common_1.BadRequestException("Service items cannot be transferred");
        if (item.trackInventory === false)
            throw new common_1.BadRequestException("This item does not track stock");
        const settings = await this.getOrCreateSettings(user.companyId);
        if (!settings.inventoryTrackingEnabled)
            throw new common_1.BadRequestException("Inventory tracking is disabled");
        if (!settings.warehousesEnabled)
            throw new common_1.BadRequestException("Enable warehouses before transferring stock");
        if ((input.fromBinId || input.toBinId) && !settings.binsEnabled) {
            throw new common_1.BadRequestException("Bin tracking is disabled in inventory configuration");
        }
        if ((input.batchNo || item.tracksBatch) && !settings.batchTrackingEnabled) {
            throw new common_1.BadRequestException("Batch tracking is disabled in inventory configuration");
        }
        if ((input.lotNo || item.tracksLot) && !settings.lotTrackingEnabled) {
            throw new common_1.BadRequestException("Lot tracking is disabled in inventory configuration");
        }
        if ((input.expiryDate || input.expiryDateBs || item.tracksExpiry) && !settings.expiryTrackingEnabled) {
            throw new common_1.BadRequestException("Expiry tracking is disabled in inventory configuration");
        }
        if (item.isSerialized && !settings.serialTrackingEnabled) {
            throw new common_1.BadRequestException("Enable serial tracking in inventory configuration before transferring serialized items");
        }
        if (item.isKit && !settings.kitsEnabled) {
            throw new common_1.BadRequestException("Enable kits in inventory configuration before transferring kit items");
        }
        if (item.tracksBatch && !input.batchNo)
            throw new common_1.BadRequestException("Batch number is required for this item");
        if (item.tracksLot && !input.lotNo)
            throw new common_1.BadRequestException("Lot number is required for this item");
        if (item.tracksExpiry && !input.expiryDate && !input.expiryDateBs) {
            throw new common_1.BadRequestException("Expiry date is required for this item");
        }
        const [fromWarehouse, toWarehouse] = await Promise.all([
            this.prisma.warehouse.findFirst({ where: { id: input.fromWarehouseId, companyId: user.companyId, isActive: true } }),
            this.prisma.warehouse.findFirst({ where: { id: input.toWarehouseId, companyId: user.companyId, isActive: true } })
        ]);
        if (!fromWarehouse)
            throw new common_1.BadRequestException("Source warehouse not found");
        if (!toWarehouse)
            throw new common_1.BadRequestException("Destination warehouse not found");
        if (input.fromBinId) {
            const fromBin = await this.prisma.warehouseBin.findFirst({
                where: { id: input.fromBinId, companyId: user.companyId, warehouseId: input.fromWarehouseId, isActive: true }
            });
            if (!fromBin)
                throw new common_1.BadRequestException("Source bin not found");
        }
        if (input.toBinId) {
            const toBin = await this.prisma.warehouseBin.findFirst({
                where: { id: input.toBinId, companyId: user.companyId, warehouseId: input.toWarehouseId, isActive: true }
            });
            if (!toBin)
                throw new common_1.BadRequestException("Destination bin not found");
        }
        const qty = new client_1.Prisma.Decimal(input.qty);
        const resolved = (0, nepali_date_1.resolveAdDate)(input.date, input.dateBs);
        const serialNumbers = this.assertSerializedQuantity(item, qty, input.serialNumbers);
        const sourceBalance = await this.prisma.stockLedger.aggregate({
            where: {
                companyId: user.companyId,
                itemId: input.itemId,
                warehouseId: input.fromWarehouseId,
                binId: input.fromBinId ?? null
            },
            _sum: { qtyIn: true, qtyOut: true }
        });
        const sourceQty = new client_1.Prisma.Decimal(sourceBalance._sum.qtyIn ?? 0).sub(new client_1.Prisma.Decimal(sourceBalance._sum.qtyOut ?? 0));
        if (sourceQty.lt(qty) && !settings.allowNegativeStock) {
            throw new common_1.BadRequestException(`Insufficient source stock in ${fromWarehouse.name}. Available: ${sourceQty.toString()}, Requested: ${qty.toString()}`);
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
                    voucherType: client_1.VoucherType.journal,
                    status: client_1.VoucherStatus.posted,
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
                    sourceDocumentType: "transfer",
                    sourceDocumentId: voucher.id,
                    warehouseId: input.fromWarehouseId,
                    binId: input.fromBinId ?? null,
                    qtyIn: new client_1.Prisma.Decimal(0),
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
                    sourceDocumentType: "transfer",
                    sourceDocumentId: voucher.id,
                    warehouseId: input.toWarehouseId,
                    binId: input.toBinId ?? null,
                    qtyIn: qty,
                    qtyOut: new client_1.Prisma.Decimal(0),
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
                    throw new common_1.BadRequestException("One or more serial numbers are not available at the source location");
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
    async getInventoryAlerts(user, query) {
        const expiringWithinDays = query.expiringWithinDays ?? 30;
        const noMovementDays = query.noMovementDays ?? 90;
        const limit = query.limit ?? 100;
        const now = new Date();
        const expiringCutoff = new Date(now);
        expiringCutoff.setDate(expiringCutoff.getDate() + expiringWithinDays);
        const noMovementCutoff = new Date(now);
        noMovementCutoff.setDate(noMovementCutoff.getDate() - noMovementDays);
        const report = await this.getStockReport(user, {});
        const goods = report.filter((r) => r.type === "goods");
        const belowReorder = goods
            .filter((r) => Boolean(r.isLowStock))
            .slice(0, limit)
            .map((r) => ({
            itemId: r.id,
            name: r.name,
            sku: r.sku ?? null,
            availableQty: r.availableQty ?? 0,
            reorderLevel: r.reorderLevel ?? 0,
            safetyStock: r.safetyStock ?? 0
        }));
        const zeroStock = goods
            .filter((r) => Number(r.onHandQty ?? r.closingQty ?? 0) <= 0)
            .slice(0, limit)
            .map((r) => ({
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
            const qty = Number(new client_1.Prisma.Decimal(row._sum.qtyIn ?? 0).sub(new client_1.Prisma.Decimal(row._sum.qtyOut ?? 0)).toString());
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
            .filter((r) => staleSet.has(r.id))
            .slice(0, limit)
            .map((r) => ({ itemId: r.id, name: r.name, sku: r.sku ?? null }));
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
    async listReservations(user, query) {
        const db = this.prisma;
        if (!db.stockReservation)
            return [];
        const rows = await db.stockReservation.findMany({
            where: {
                companyId: user.companyId,
                itemId: query.itemId,
                salesOrderId: query.salesOrderId,
                status: query.status
            },
            orderBy: [{ reservedAt: "desc" }, { createdAt: "desc" }],
            take: query.take ?? 200
        }).catch((error) => {
            if (this.isMissingInventoryTableError(error))
                return [];
            throw error;
        });
        const itemIds = Array.from(new Set(rows.map((row) => row.itemId).filter(Boolean)));
        const salesOrderIds = Array.from(new Set(rows.map((row) => row.salesOrderId).filter(Boolean)));
        const [items, orders] = await Promise.all([
            itemIds.length
                ? this.prisma.item.findMany({
                    where: { companyId: user.companyId, id: { in: itemIds } },
                    select: { id: true, name: true, sku: true, unit: true }
                })
                : Promise.resolve([]),
            salesOrderIds.length
                ? this.prisma.salesOrder.findMany({
                    where: { companyId: user.companyId, id: { in: salesOrderIds } },
                    select: { id: true, orderNo: true, status: true, party: { select: { id: true, name: true } } }
                })
                : Promise.resolve([])
        ]);
        const itemMap = new Map(items.map((item) => [item.id, item]));
        const orderMap = new Map(orders.map((order) => [order.id, order]));
        return rows.map((row) => {
            const item = itemMap.get(row.itemId);
            const order = row.salesOrderId ? orderMap.get(row.salesOrderId) : null;
            return {
                ...row,
                openQty: row.reservedQty.sub(row.releasedQty).sub(row.fulfilledQty),
                itemName: item?.name ?? null,
                sku: item?.sku ?? null,
                unit: item?.unit ?? null,
                salesOrderNo: order?.orderNo ?? null,
                salesOrderStatus: order?.status ?? null,
                customerId: order?.party?.id ?? null,
                customerName: order?.party?.name ?? null
            };
        });
    }
    async reserveSalesOrderStock(user, salesOrderId, options) {
        const db = this.prisma;
        if (!db.stockReservation)
            throw new common_1.BadRequestException("Run the inventory workflow migration before reserving stock");
        const order = await this.prisma.salesOrder.findFirst({
            where: { id: salesOrderId, companyId: user.companyId, status: "open" },
            include: { items: { include: { item: true } } }
        });
        if (!order)
            throw new common_1.BadRequestException("Open sales order not found");
        const stockRows = await this.getStockReport(user, {});
        const stockByItem = new Map(stockRows.map((row) => [row.id, row]));
        const results = [];
        for (const line of order.items) {
            if (!line.itemId || !line.item || line.item.type === "services" || line.item.trackInventory === false)
                continue;
            const requiredQty = line.qty.sub(line.fulfilledQty);
            if (requiredQty.lte(0))
                continue;
            const existing = await db.stockReservation.findFirst({
                where: {
                    companyId: user.companyId,
                    salesOrderItemId: line.id,
                    status: { in: ["active", "partial"] }
                }
            });
            const existingOpen = existing
                ? existing.reservedQty.sub(existing.releasedQty).sub(existing.fulfilledQty)
                : new client_1.Prisma.Decimal(0);
            const row = stockByItem.get(line.itemId);
            const available = new client_1.Prisma.Decimal(row?.availableQty ?? row?.closingQty ?? 0).add(existingOpen);
            const reservedQty = client_1.Prisma.Decimal.min(requiredQty, available.gt(0) ? available : new client_1.Prisma.Decimal(0));
            const status = reservedQty.gte(requiredQty) ? "active" : "partial";
            const payload = {
                companyId: user.companyId,
                salesOrderId: order.id,
                salesOrderItemId: line.id,
                itemId: line.itemId,
                qty: requiredQty,
                reservedQty,
                releasedQty: new client_1.Prisma.Decimal(0),
                fulfilledQty: line.fulfilledQty,
                status,
                expiresAt: options.expiresAt ?? null
            };
            const saved = existing
                ? await db.stockReservation.update({
                    where: { id: existing.id },
                    data: payload
                })
                : await db.stockReservation.create({ data: payload });
            results.push(saved);
        }
        return { ok: true, salesOrderId, reservations: results };
    }
    async releaseReservation(user, id) {
        const db = this.prisma;
        if (!db.stockReservation)
            throw new common_1.BadRequestException("Run the inventory workflow migration before releasing stock reservations");
        const reservation = await db.stockReservation.findFirst({ where: { id, companyId: user.companyId } });
        if (!reservation)
            throw new common_1.BadRequestException("Reservation not found");
        const openQty = reservation.reservedQty.sub(reservation.releasedQty).sub(reservation.fulfilledQty);
        return db.stockReservation.update({
            where: { id },
            data: {
                releasedQty: reservation.releasedQty.add(openQty.gt(0) ? openQty : new client_1.Prisma.Decimal(0)),
                status: "released"
            }
        });
    }
    async fulfillSalesOrderDispatchLine(tx, companyId, salesOrderId, itemId, dispatchQty) {
        if (!salesOrderId || dispatchQty.lte(0))
            return;
        const order = await tx.salesOrder.findFirst({
            where: { id: salesOrderId, companyId, status: { in: [client_1.SalesOrderStatus.open, client_1.SalesOrderStatus.draft] } },
            select: { id: true }
        });
        if (!order)
            throw new common_1.BadRequestException("Open sales order not found for dispatch");
        const orderLines = await tx.salesOrderItem.findMany({
            where: { orderId: salesOrderId, itemId },
            orderBy: [{ createdAt: "asc" }, { id: "asc" }]
        });
        if (!orderLines.length)
            throw new common_1.BadRequestException("Dispatch item is not present in the selected sales order");
        const db = tx;
        let remaining = dispatchQty;
        for (const orderLine of orderLines) {
            if (remaining.lte(0))
                break;
            const pending = orderLine.qty.sub(orderLine.fulfilledQty);
            if (pending.lte(0))
                continue;
            const consumeQty = client_1.Prisma.Decimal.min(pending, remaining);
            await tx.salesOrderItem.update({
                where: { id: orderLine.id },
                data: { fulfilledQty: orderLine.fulfilledQty.add(consumeQty) }
            });
            if (db.stockReservation) {
                let reservationRemaining = consumeQty;
                const reservations = await db.stockReservation.findMany({
                    where: {
                        companyId,
                        salesOrderId,
                        salesOrderItemId: orderLine.id,
                        status: { in: ["active", "partial"] }
                    },
                    orderBy: [{ reservedAt: "asc" }, { createdAt: "asc" }]
                }).catch((error) => {
                    if (this.isMissingInventoryTableError(error))
                        return [];
                    throw error;
                });
                for (const reservation of reservations) {
                    if (reservationRemaining.lte(0))
                        break;
                    const reservationOpen = reservation.reservedQty.sub(reservation.releasedQty).sub(reservation.fulfilledQty);
                    if (reservationOpen.lte(0))
                        continue;
                    const fulfilledQty = client_1.Prisma.Decimal.min(reservationOpen, reservationRemaining);
                    const nextFulfilled = reservation.fulfilledQty.add(fulfilledQty);
                    const nextOpen = reservation.reservedQty.sub(reservation.releasedQty).sub(nextFulfilled);
                    await db.stockReservation.update({
                        where: { id: reservation.id },
                        data: {
                            fulfilledQty: nextFulfilled,
                            status: nextOpen.lte(0) ? "fulfilled" : "partial"
                        }
                    });
                    reservationRemaining = reservationRemaining.sub(fulfilledQty);
                }
            }
            remaining = remaining.sub(consumeQty);
        }
        if (remaining.gt(0))
            throw new common_1.BadRequestException("Dispatch quantity exceeds pending sales order quantity");
        const remainingLines = await tx.salesOrderItem.findMany({
            where: { orderId: salesOrderId },
            select: { qty: true, fulfilledQty: true }
        });
        const fulfilled = remainingLines.every((line) => line.fulfilledQty.gte(line.qty));
        await tx.salesOrder.update({
            where: { id: salesOrderId },
            data: { status: fulfilled ? client_1.SalesOrderStatus.fulfilled : client_1.SalesOrderStatus.open }
        });
    }
    async refreshTrackedStockMaster(tx, companyId, itemId) {
        const db = tx;
        if (!db.inventoryTrackedStockMaster || !db.inventoryLayer)
            return;
        const layers = await db.inventoryLayer.groupBy({
            by: ["warehouseId", "binId", "batchNo", "lotNo", "expiryDate", "expiryDateBs"],
            where: { companyId, itemId, remainingQty: { gt: new client_1.Prisma.Decimal(0) } },
            _sum: { remainingQty: true, totalCost: true },
            _avg: { unitCost: true },
            _min: { receivedDate: true },
            _max: { updatedAt: true }
        }).catch((error) => {
            if (this.isMissingInventoryTableError(error))
                return [];
            throw error;
        });
        await db.inventoryTrackedStockMaster.deleteMany({ where: { companyId, itemId } }).catch((error) => {
            if (this.isMissingInventoryTableError(error))
                return null;
            throw error;
        });
        if (!layers.length)
            return;
        await db.inventoryTrackedStockMaster.createMany({
            data: layers.map((layer) => ({
                companyId,
                itemId,
                warehouseId: layer.warehouseId ?? null,
                binId: layer.binId ?? null,
                batchNo: layer.batchNo ?? null,
                lotNo: layer.lotNo ?? null,
                expiryDate: layer.expiryDate ?? null,
                expiryDateBs: layer.expiryDateBs ?? null,
                firstReceivedAt: layer._min.receivedDate ?? null,
                lastMovementAt: layer._max.updatedAt ?? null,
                currentQty: layer._sum.remainingQty ?? new client_1.Prisma.Decimal(0),
                unitCost: layer._avg.unitCost ?? new client_1.Prisma.Decimal(0),
                value: layer._sum.totalCost ?? new client_1.Prisma.Decimal(0),
                status: layer.expiryDate && layer.expiryDate < new Date() ? "expired" : "active"
            }))
        }).catch((error) => {
            if (this.isMissingInventoryTableError(error))
                return null;
            throw error;
        });
    }
    async postGoodsReceipt(user, input) {
        const db = this.prisma;
        if (!db.goodsReceipt)
            throw new common_1.BadRequestException("Run the inventory workflow migration before posting goods receipts");
        const settings = await this.getOrCreateSettings(user.companyId);
        if (!settings.inventoryTrackingEnabled || !settings.goodsReceiptWorkflowEnabled) {
            throw new common_1.BadRequestException("Enable Goods Receipt Workflow in inventory configuration before posting goods receipts");
        }
        const resolved = (0, nepali_date_1.resolveAdDate)(input.date, input.dateBs);
        const purchaseOrder = input.purchaseOrderId
            ? await this.prisma.purchaseOrder.findFirst({
                where: { id: input.purchaseOrderId, companyId: user.companyId },
                include: { items: true }
            })
            : null;
        if (input.purchaseOrderId && !purchaseOrder)
            throw new common_1.BadRequestException("Purchase order not found");
        if (purchaseOrder && purchaseOrder.status === "cancelled") {
            throw new common_1.BadRequestException("Cancelled purchase orders cannot receive goods");
        }
        const poLinesByItem = new Map();
        for (const poLine of purchaseOrder?.items ?? []) {
            if (!poLine.itemId)
                continue;
            const lines = poLinesByItem.get(poLine.itemId) ?? [];
            lines.push(poLine);
            poLinesByItem.set(poLine.itemId, lines);
        }
        return this.prisma.$transaction(async (tx) => {
            const receipt = await tx.goodsReceipt.create({
                data: {
                    companyId: user.companyId,
                    receiptNo: input.receiptNo ?? null,
                    purchaseOrderId: input.purchaseOrderId ?? null,
                    supplierId: input.supplierId ?? null,
                    date: resolved.date,
                    dateBs: resolved.bs || input.dateBs || null,
                    status: "posted",
                    memo: input.memo ?? null,
                    postedByUserId: user.sub,
                    postedAt: new Date()
                }
            });
            const postedLines = [];
            const receivedByPoLine = new Map();
            for (const line of input.lines) {
                const item = await tx.item.findFirst({ where: { id: line.itemId, companyId: user.companyId } });
                if (!item)
                    throw new common_1.BadRequestException("Item not found");
                const qty = new client_1.Prisma.Decimal(line.qty);
                if (qty.lte(0))
                    throw new common_1.BadRequestException(`Receiving quantity must be greater than zero for "${item.name}"`);
                const poLine = poLinesByItem.get(item.id)?.find((candidate) => candidate.qty.sub(candidate.receivedQty).gte(qty));
                if (purchaseOrder && !poLine) {
                    throw new common_1.BadRequestException(`Receiving quantity exceeds pending purchase order quantity for "${item.name}"`);
                }
                const rate = new client_1.Prisma.Decimal(line.rate ?? item.purchasePrice ?? 0);
                if (rate.lte(0))
                    throw new common_1.BadRequestException(`Rate is required for goods receipt item "${item.name}"`);
                const movement = await this.applyMovementPolicy(user.companyId, item, line, tx);
                const serialNumbers = this.assertSerializedQuantity(item, qty, line.serialNumbers);
                const amount = qty.mul(rate);
                const ledger = await tx.stockLedger.create({
                    data: {
                        companyId: user.companyId,
                        itemId: item.id,
                        date: resolved.date,
                        dateBs: resolved.bs || input.dateBs || null,
                        sourceDocumentType: "goods_receipt",
                        sourceDocumentId: receipt.id,
                        warehouseId: movement.warehouseId,
                        binId: movement.binId,
                        qtyIn: qty,
                        qtyOut: new client_1.Prisma.Decimal(0),
                        rate,
                        amount,
                        batchNo: line.batchNo || null,
                        lotNo: line.lotNo || null,
                        expiryDate: line.expiryDate || null,
                        expiryDateBs: line.expiryDateBs || null
                    }
                });
                await this.receiveInventoryLayer(tx, {
                    companyId: user.companyId,
                    itemId: item.id,
                    qty,
                    unitCost: rate,
                    date: resolved.date,
                    sourceLedgerId: ledger.id,
                    sourceType: "goods_receipt",
                    warehouseId: movement.warehouseId,
                    binId: movement.binId,
                    batchNo: line.batchNo || null,
                    lotNo: line.lotNo || null,
                    expiryDate: line.expiryDate || null,
                    expiryDateBs: line.expiryDateBs || null
                });
                if (serialNumbers.length) {
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
                }
                const savedLine = await tx.goodsReceiptLine.create({
                    data: {
                        goodsReceiptId: receipt.id,
                        itemId: item.id,
                        qty,
                        rate,
                        amount,
                        warehouseId: movement.warehouseId,
                        binId: movement.binId,
                        batchNo: line.batchNo || null,
                        lotNo: line.lotNo || null,
                        expiryDate: line.expiryDate || null,
                        expiryDateBs: line.expiryDateBs || null,
                        stockLedgerId: ledger.id
                    }
                });
                if (poLine) {
                    receivedByPoLine.set(poLine.id, (receivedByPoLine.get(poLine.id) ?? new client_1.Prisma.Decimal(0)).add(qty));
                }
                await this.refreshTrackedStockMaster(tx, user.companyId, item.id);
                postedLines.push(savedLine);
            }
            for (const [poLineId, qty] of receivedByPoLine) {
                await tx.purchaseOrderItem.update({
                    where: { id: poLineId },
                    data: { receivedQty: { increment: qty } }
                });
            }
            if (purchaseOrder) {
                const freshLines = await tx.purchaseOrderItem.findMany({ where: { orderId: purchaseOrder.id } });
                const fullyReceived = freshLines.every((line) => line.receivedQty.gte(line.qty));
                await tx.purchaseOrder.update({
                    where: { id: purchaseOrder.id },
                    data: { status: fullyReceived ? "received" : "open" }
                });
            }
            return { ok: true, receiptId: receipt.id, lines: postedLines };
        });
    }
    async listGoodsReceipts(user, filters) {
        const db = this.prisma;
        if (!db.goodsReceipt)
            throw new common_1.BadRequestException("Run the inventory workflow migration before listing goods receipts");
        const where = { companyId: user.companyId };
        if (filters.purchaseOrderId)
            where.purchaseOrderId = filters.purchaseOrderId;
        if (filters.supplierId)
            where.supplierId = filters.supplierId;
        if (filters.status)
            where.status = filters.status;
        if (filters.from || filters.to) {
            where.date = {};
            if (filters.from)
                where.date.gte = filters.from;
            if (filters.to)
                where.date.lte = filters.to;
        }
        const take = filters.take ?? 50;
        const skip = filters.skip ?? 0;
        const [total, rows] = await this.prisma.$transaction([
            db.goodsReceipt.count({ where }),
            db.goodsReceipt.findMany({
                where,
                include: { lines: true },
                orderBy: [{ date: "desc" }, { createdAt: "desc" }],
                skip,
                take
            })
        ]);
        const purchaseOrderIds = rows.map((row) => row.purchaseOrderId).filter(Boolean);
        const supplierIds = rows.map((row) => row.supplierId).filter(Boolean);
        const itemIds = rows.flatMap((row) => row.lines.map((line) => line.itemId)).filter(Boolean);
        const [purchaseOrders, suppliers, items] = await Promise.all([
            purchaseOrderIds.length
                ? this.prisma.purchaseOrder.findMany({
                    where: { companyId: user.companyId, id: { in: Array.from(new Set(purchaseOrderIds)) } },
                    select: { id: true, orderNo: true, partyId: true, party: { select: { id: true, name: true } } }
                })
                : Promise.resolve([]),
            supplierIds.length
                ? this.prisma.party.findMany({
                    where: { companyId: user.companyId, id: { in: Array.from(new Set(supplierIds)) } },
                    select: { id: true, name: true }
                })
                : Promise.resolve([]),
            itemIds.length
                ? this.prisma.item.findMany({
                    where: { companyId: user.companyId, id: { in: Array.from(new Set(itemIds)) } },
                    select: { id: true, name: true, sku: true, unit: true }
                })
                : Promise.resolve([])
        ]);
        const poById = new Map(purchaseOrders.map((order) => [order.id, order]));
        const supplierById = new Map(suppliers.map((supplier) => [supplier.id, supplier]));
        const itemById = new Map(items.map((item) => [item.id, item]));
        const q = filters.q?.toLowerCase();
        const data = rows
            .map((row) => {
            const po = row.purchaseOrderId ? poById.get(row.purchaseOrderId) : null;
            const supplier = row.supplierId ? supplierById.get(row.supplierId) : po?.party ?? null;
            const lines = row.lines.map((line) => ({
                ...line,
                item: itemById.get(line.itemId) ?? null
            }));
            const qty = lines.reduce((sum, line) => sum + Number(line.qty ?? 0), 0);
            const amount = lines.reduce((sum, line) => sum + Number(line.amount ?? 0), 0);
            return {
                ...row,
                purchaseOrderNo: po?.orderNo ?? null,
                supplierName: supplier?.name ?? null,
                lineCount: lines.length,
                totalQty: qty,
                totalAmount: amount,
                lines
            };
        })
            .filter((row) => {
            if (!q)
                return true;
            const haystack = [
                row.receiptNo,
                row.purchaseOrderNo,
                row.supplierName,
                row.memo,
                ...row.lines.map((line) => line.item?.name),
                ...row.lines.map((line) => line.item?.sku)
            ].filter(Boolean).join(" ").toLowerCase();
            return haystack.includes(q);
        });
        return {
            data,
            meta: {
                total: q ? data.length : total,
                page: Math.floor(skip / take) + 1,
                lastPage: Math.max(1, Math.ceil((q ? data.length : total) / take))
            }
        };
    }
    async listStockDispatches(user, filters) {
        const db = this.prisma;
        if (!db.stockDispatch)
            throw new common_1.BadRequestException("Run the inventory workflow migration before listing stock dispatches");
        const where = { companyId: user.companyId };
        if (filters.salesOrderId)
            where.salesOrderId = filters.salesOrderId;
        if (filters.customerId)
            where.customerId = filters.customerId;
        if (filters.status)
            where.status = filters.status;
        if (filters.from || filters.to) {
            where.date = {};
            if (filters.from)
                where.date.gte = filters.from;
            if (filters.to)
                where.date.lte = filters.to;
        }
        const take = filters.take ?? 50;
        const skip = filters.skip ?? 0;
        const [total, rows] = await this.prisma.$transaction([
            db.stockDispatch.count({ where }),
            db.stockDispatch.findMany({
                where,
                include: { lines: true },
                orderBy: [{ date: "desc" }, { createdAt: "desc" }],
                skip,
                take
            })
        ]);
        const salesOrderIds = rows.map((row) => row.salesOrderId).filter(Boolean);
        const customerIds = rows.map((row) => row.customerId).filter(Boolean);
        const itemIds = rows.flatMap((row) => row.lines.map((line) => line.itemId)).filter(Boolean);
        const [salesOrders, customers, items] = await Promise.all([
            salesOrderIds.length
                ? this.prisma.salesOrder.findMany({
                    where: { companyId: user.companyId, id: { in: Array.from(new Set(salesOrderIds)) } },
                    select: { id: true, orderNo: true, partyId: true, party: { select: { id: true, name: true } } }
                })
                : Promise.resolve([]),
            customerIds.length
                ? this.prisma.party.findMany({
                    where: { companyId: user.companyId, id: { in: Array.from(new Set(customerIds)) } },
                    select: { id: true, name: true }
                })
                : Promise.resolve([]),
            itemIds.length
                ? this.prisma.item.findMany({
                    where: { companyId: user.companyId, id: { in: Array.from(new Set(itemIds)) } },
                    select: { id: true, name: true, sku: true, unit: true }
                })
                : Promise.resolve([])
        ]);
        const soById = new Map(salesOrders.map((so) => [so.id, so]));
        const customerById = new Map(customers.map((customer) => [customer.id, customer]));
        const itemById = new Map(items.map((item) => [item.id, item]));
        const q = filters.q?.toLowerCase();
        const data = rows
            .map((row) => {
            const so = row.salesOrderId ? soById.get(row.salesOrderId) : null;
            const customer = row.customerId ? customerById.get(row.customerId) : so?.party ?? null;
            const lines = row.lines.map((line) => ({
                ...line,
                item: itemById.get(line.itemId) ?? null
            }));
            const qty = lines.reduce((sum, line) => sum + Number(line.qty ?? 0), 0);
            const amount = lines.reduce((sum, line) => sum + Number(line.amount ?? 0), 0);
            return {
                ...row,
                salesOrderNo: so?.orderNo ?? null,
                customerName: customer?.name ?? null,
                lineCount: lines.length,
                totalQty: qty,
                totalAmount: amount,
                lines
            };
        })
            .filter((row) => {
            if (!q)
                return true;
            const haystack = [
                row.dispatchNo,
                row.salesOrderNo,
                row.customerName,
                row.memo,
                ...row.lines.map((line) => line.item?.name),
                ...row.lines.map((line) => line.item?.sku)
            ].filter(Boolean).join(" ").toLowerCase();
            return haystack.includes(q);
        });
        return {
            data,
            meta: {
                total: q ? data.length : total,
                page: Math.floor(skip / take) + 1,
                lastPage: Math.max(1, Math.ceil((q ? data.length : total) / take))
            }
        };
    }
    async postStockDispatch(user, input) {
        const db = this.prisma;
        if (!db.stockDispatch)
            throw new common_1.BadRequestException("Run the inventory workflow migration before posting dispatches");
        const settings = await this.getOrCreateSettings(user.companyId);
        if (!settings.inventoryTrackingEnabled || !settings.dispatchWorkflowEnabled) {
            throw new common_1.BadRequestException("Delivery / Dispatch workflow is disabled in Inventory Configuration");
        }
        const resolved = (0, nepali_date_1.resolveAdDate)(input.date, input.dateBs);
        return this.prisma.$transaction(async (tx) => {
            const dispatch = await tx.stockDispatch.create({
                data: {
                    companyId: user.companyId,
                    dispatchNo: input.dispatchNo ?? null,
                    salesOrderId: input.salesOrderId ?? null,
                    customerId: input.customerId ?? null,
                    date: resolved.date,
                    dateBs: resolved.bs || input.dateBs || null,
                    status: "posted",
                    memo: input.memo ?? null,
                    postedByUserId: user.sub,
                    postedAt: new Date()
                }
            });
            const postedLines = [];
            for (const line of input.lines) {
                const item = await tx.item.findFirst({ where: { id: line.itemId, companyId: user.companyId } });
                if (!item)
                    throw new common_1.BadRequestException("Item not found");
                const qty = new client_1.Prisma.Decimal(line.qty);
                const movement = await this.applyMovementPolicy(user.companyId, item, line, tx);
                const serialNumbers = this.assertSerializedQuantity(item, qty, line.serialNumbers);
                const cost = await this.consumeInventoryCost(tx, {
                    companyId: user.companyId,
                    itemId: item.id,
                    qty,
                    costingMethod: settings.costingMethod,
                    allowNegative: settings.allowNegativeStock,
                    warehouseId: movement.warehouseId,
                    binId: movement.binId,
                    batchNo: line.batchNo || null,
                    lotNo: line.lotNo || null,
                    expiryDate: line.expiryDate || null
                });
                const ledger = await tx.stockLedger.create({
                    data: {
                        companyId: user.companyId,
                        itemId: item.id,
                        date: resolved.date,
                        dateBs: resolved.bs || input.dateBs || null,
                        sourceDocumentType: "dispatch",
                        sourceDocumentId: dispatch.id,
                        warehouseId: movement.warehouseId,
                        binId: movement.binId,
                        qtyIn: new client_1.Prisma.Decimal(0),
                        qtyOut: qty,
                        rate: cost.unitCost,
                        amount: cost.amount,
                        batchNo: line.batchNo || null,
                        lotNo: line.lotNo || null,
                        expiryDate: line.expiryDate || null,
                        expiryDateBs: line.expiryDateBs || null
                    }
                });
                if (serialNumbers.length) {
                    const serialRows = await tx.serialNumber.findMany({
                        where: {
                            companyId: user.companyId,
                            itemId: item.id,
                            serialNo: { in: serialNumbers },
                            status: "available",
                            warehouseId: movement.warehouseId ?? undefined,
                            binId: movement.binId ?? undefined
                        },
                        select: { id: true, serialNo: true, status: true, warehouseId: true, binId: true }
                    });
                    if (serialRows.length !== serialNumbers.length)
                        throw new common_1.BadRequestException("One or more serial numbers are not available for dispatch");
                    await tx.serialNumber.updateMany({ where: { id: { in: serialRows.map((s) => s.id) } }, data: { status: "sold" } });
                    await this.recordSerialMovements(tx, {
                        companyId: user.companyId,
                        itemId: item.id,
                        serials: serialRows,
                        stockLedgerId: ledger.id,
                        movementType: "dispatch",
                        statusTo: "sold",
                        movementDate: resolved.date,
                        movementDateBs: resolved.bs || null
                    });
                }
                const savedLine = await tx.stockDispatchLine.create({
                    data: {
                        stockDispatchId: dispatch.id,
                        itemId: item.id,
                        qty,
                        rate: cost.unitCost,
                        amount: cost.amount,
                        warehouseId: movement.warehouseId,
                        binId: movement.binId,
                        batchNo: line.batchNo || null,
                        lotNo: line.lotNo || null,
                        expiryDate: line.expiryDate || null,
                        expiryDateBs: line.expiryDateBs || null,
                        stockLedgerId: ledger.id
                    }
                });
                await this.fulfillSalesOrderDispatchLine(tx, user.companyId, input.salesOrderId, item.id, qty);
                await this.refreshTrackedStockMaster(tx, user.companyId, item.id);
                postedLines.push(savedLine);
            }
            return { ok: true, dispatchId: dispatch.id, lines: postedLines };
        });
    }
    async listBatchLotMaster(user, query) {
        const db = this.prisma;
        if (db.inventoryTrackedStockMaster) {
            const where = {
                companyId: user.companyId,
                itemId: query.itemId,
                warehouseId: query.warehouseId,
                binId: query.binId
            };
            if (query.includeZero === false)
                where.currentQty = { gt: new client_1.Prisma.Decimal(0) };
            if (query.q) {
                where.OR = [
                    { batchNo: { contains: query.q, mode: "insensitive" } },
                    { lotNo: { contains: query.q, mode: "insensitive" } }
                ];
            }
            const rows = await db.inventoryTrackedStockMaster.findMany({
                where,
                orderBy: [{ lastMovementAt: "desc" }, { createdAt: "desc" }],
                take: query.take ?? 500
            }).catch((error) => {
                if (this.isMissingInventoryTableError(error))
                    return null;
                throw error;
            });
            if (rows)
                return rows;
        }
        const valuation = await this.getStockValuationReport(user, {
            itemId: query.itemId,
            warehouseId: query.warehouseId,
            binId: query.binId,
            includeZero: query.includeZero
        });
        return valuation.rows.flatMap((row) => row.layers
            .filter((layer) => !query.q || [layer.batchNo, layer.lotNo].some((v) => String(v ?? "").toLowerCase().includes(query.q.toLowerCase())))
            .map((layer) => ({ itemId: row.itemId, itemName: row.name, sku: row.sku, ...layer, currentQty: layer.qty, value: layer.value }))).slice(0, query.take ?? 500);
    }
    async getReorderSuggestions(user) {
        const report = await this.getStockReport(user, {});
        return report
            .filter((row) => row.type === "goods" && row.trackInventory !== false)
            .map((row) => {
            const suggestedQty = Number(row.suggestedQty ?? 0);
            return { ...row, suggestedQty };
        })
            .filter((row) => Boolean(row.isLowStock) && Number(row.suggestedQty ?? 0) > 0)
            .sort((a, b) => a.availableQty - b.availableQty);
    }
    async listMovementApprovals(user, query) {
        const db = this.prisma;
        if (!db.inventoryMovementApproval)
            return [];
        return db.inventoryMovementApproval.findMany({
            where: { companyId: user.companyId, status: query.status, movementType: query.movementType },
            orderBy: { requestedAt: "desc" },
            take: query.take ?? 100
        }).catch((error) => {
            if (this.isMissingInventoryTableError(error))
                return [];
            throw error;
        });
    }
    async createMovementApproval(user, input) {
        const db = this.prisma;
        if (!db.inventoryMovementApproval)
            throw new common_1.BadRequestException("Run the inventory workflow migration before using movement approvals");
        return db.inventoryMovementApproval.create({
            data: {
                companyId: user.companyId,
                movementType: input.movementType,
                payloadJson: input.payload,
                reason: input.reason ?? null,
                requestedByUserId: user.sub,
                status: "pending"
            }
        });
    }
    async approveMovementApproval(user, id, input) {
        const db = this.prisma;
        if (!db.inventoryMovementApproval)
            throw new common_1.BadRequestException("Run the inventory workflow migration before using movement approvals");
        const approval = await db.inventoryMovementApproval.findFirst({ where: { id, companyId: user.companyId } });
        if (!approval)
            throw new common_1.BadRequestException("Approval request not found");
        if (approval.status !== "pending")
            throw new common_1.BadRequestException("Only pending movement requests can be approved");
        const result = approval.movementType === "adjustment"
            ? await this.adjustStock(user, approval.payloadJson)
            : await this.transferStock(user, approval.payloadJson);
        return db.inventoryMovementApproval.update({
            where: { id },
            data: {
                status: "approved",
                approvedByUserId: user.sub,
                approvedAt: new Date(),
                reason: input.reason ?? approval.reason,
                postedVoucherId: result.voucherId ?? null
            }
        });
    }
    async rejectMovementApproval(user, id, input) {
        const db = this.prisma;
        if (!db.inventoryMovementApproval)
            throw new common_1.BadRequestException("Run the inventory workflow migration before using movement approvals");
        const approval = await db.inventoryMovementApproval.findFirst({ where: { id, companyId: user.companyId } });
        if (!approval)
            throw new common_1.BadRequestException("Approval request not found");
        if (approval.status !== "pending")
            throw new common_1.BadRequestException("Only pending movement requests can be rejected");
        return db.inventoryMovementApproval.update({
            where: { id },
            data: { status: "rejected", rejectedByUserId: user.sub, rejectedAt: new Date(), reason: input.reason ?? approval.reason }
        });
    }
    async reverseMovementApproval(user, id, input) {
        const db = this.prisma;
        if (!db.inventoryMovementApproval)
            throw new common_1.BadRequestException("Run the inventory workflow migration before using movement approvals");
        const approval = await db.inventoryMovementApproval.findFirst({ where: { id, companyId: user.companyId } });
        if (!approval)
            throw new common_1.BadRequestException("Approval request not found");
        if (approval.status !== "approved")
            throw new common_1.BadRequestException("Only approved movement requests can be reversed");
        const payload = approval.payloadJson;
        const result = approval.movementType === "adjustment"
            ? await this.adjustStock(user, { ...payload, qty: -Number(payload.qty), memo: input.reason || `Reversal of approved adjustment ${approval.id}` })
            : await this.transferStock(user, {
                ...payload,
                fromWarehouseId: payload.toWarehouseId,
                fromBinId: payload.toBinId,
                toWarehouseId: payload.fromWarehouseId,
                toBinId: payload.fromBinId,
                memo: input.reason || `Reversal of approved transfer ${approval.id}`
            });
        return db.inventoryMovementApproval.update({
            where: { id },
            data: { status: "reversed", reversedByUserId: user.sub, reversedAt: new Date(), reversalVoucherId: result.voucherId ?? null }
        });
    }
    async listPeriodCloses(user, query) {
        const db = this.prisma;
        if (!db.inventoryPeriodClose)
            return [];
        return db.inventoryPeriodClose.findMany({
            where: { companyId: user.companyId, status: query.status },
            orderBy: { periodTo: "desc" },
            take: query.take ?? 100
        }).catch((error) => {
            if (this.isMissingInventoryTableError(error))
                return [];
            throw error;
        });
    }
    async closeInventoryPeriod(user, input) {
        const db = this.prisma;
        if (!db.inventoryPeriodClose)
            throw new common_1.BadRequestException("Run the inventory workflow migration before closing inventory periods");
        const from = (0, nepali_date_1.resolveAdDate)(input.periodFrom, input.periodFromBs);
        const to = (0, nepali_date_1.resolveAdDate)(input.periodTo, input.periodToBs);
        if (from.date > to.date)
            throw new common_1.BadRequestException("Period start cannot be after period end");
        const valuation = await this.getStockValuationReport(user, { includeZero: false });
        const valuationRows = valuation.rows;
        const totalQty = valuationRows.reduce((sum, row) => sum.add(row.totalQty ?? 0), new client_1.Prisma.Decimal(0));
        const totalValue = valuationRows.reduce((sum, row) => sum.add(row.totalValue ?? 0), new client_1.Prisma.Decimal(0));
        return db.inventoryPeriodClose.upsert({
            where: {
                companyId_periodFrom_periodTo: {
                    companyId: user.companyId,
                    periodFrom: from.date,
                    periodTo: to.date
                }
            },
            create: {
                companyId: user.companyId,
                periodFrom: from.date,
                periodFromBs: from.bs || input.periodFromBs || null,
                periodTo: to.date,
                periodToBs: to.bs || input.periodToBs || null,
                status: "closed",
                costingMethod: valuation.meta.costingMethod ?? null,
                totalQty,
                totalValue,
                snapshotJson: valuation,
                closedByUserId: user.sub
            },
            update: {
                status: "closed",
                costingMethod: valuation.meta.costingMethod ?? null,
                totalQty,
                totalValue,
                snapshotJson: valuation,
                closedByUserId: user.sub,
                closedAt: new Date(),
                reopenedByUserId: null,
                reopenedAt: null
            }
        });
    }
    async listSerialNumbers(user, query) {
        const where = { companyId: user.companyId };
        if (query.itemId)
            where.itemId = query.itemId;
        if (query.status)
            where.status = query.status;
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
    async getTrackedStockOptions(user, query) {
        const item = await this.prisma.item.findFirst({
            where: { id: query.itemId, companyId: user.companyId },
            select: {
                id: true,
                name: true,
                sku: true,
                isSerialized: true,
                tracksBatch: true,
                tracksLot: true,
                tracksExpiry: true
            }
        });
        if (!item)
            throw new common_1.BadRequestException("Item not found");
        const db = this.prisma;
        let layers = [];
        try {
            layers = await db.inventoryLayer.groupBy({
                by: ["warehouseId", "binId", "batchNo", "lotNo", "expiryDate", "expiryDateBs"],
                where: {
                    companyId: user.companyId,
                    itemId: query.itemId,
                    remainingQty: { gt: new client_1.Prisma.Decimal(0) },
                    warehouseId: query.warehouseId ?? undefined,
                    binId: query.binId ?? undefined
                },
                _sum: { remainingQty: true, totalCost: true },
                _avg: { unitCost: true },
                _min: { receivedDate: true }
            });
        }
        catch (error) {
            if (!this.isMissingInventoryTableError(error))
                throw error;
        }
        const warehouseIds = Array.from(new Set(layers.map((layer) => layer.warehouseId).filter(Boolean)));
        const binIds = Array.from(new Set(layers.map((layer) => layer.binId).filter(Boolean)));
        const [warehouses, bins, serials] = await Promise.all([
            warehouseIds.length
                ? this.prisma.warehouse.findMany({ where: { id: { in: warehouseIds }, companyId: user.companyId }, select: { id: true, name: true } })
                : Promise.resolve([]),
            binIds.length
                ? this.prisma.warehouseBin.findMany({ where: { id: { in: binIds }, companyId: user.companyId }, select: { id: true, name: true } })
                : Promise.resolve([]),
            item.isSerialized
                ? this.prisma.serialNumber.findMany({
                    where: {
                        companyId: user.companyId,
                        itemId: item.id,
                        status: "available",
                        warehouseId: query.warehouseId ?? undefined,
                        binId: query.binId ?? undefined
                    },
                    select: { id: true, serialNo: true, warehouseId: true, binId: true },
                    orderBy: { serialNo: "asc" }
                })
                : Promise.resolve([])
        ]);
        const warehouseMap = new Map(warehouses.map((warehouse) => [warehouse.id, warehouse.name]));
        const binMap = new Map(bins.map((bin) => [bin.id, bin.name]));
        return {
            item,
            options: layers
                .map((layer) => ({
                warehouseId: layer.warehouseId ?? null,
                warehouseName: layer.warehouseId ? warehouseMap.get(layer.warehouseId) ?? null : null,
                binId: layer.binId ?? null,
                binName: layer.binId ? binMap.get(layer.binId) ?? null : null,
                batchNo: layer.batchNo ?? null,
                lotNo: layer.lotNo ?? null,
                expiryDate: layer.expiryDate ?? null,
                expiryDateBs: layer.expiryDateBs ?? null,
                qty: Number((layer._sum.remainingQty ?? 0).toString()),
                value: Number((layer._sum.totalCost ?? 0).toString()),
                rate: Number((layer._avg.unitCost ?? 0).toString()),
                receivedDate: layer._min.receivedDate ?? null
            }))
                .filter((layer) => layer.qty > 0)
                .sort((a, b) => String(a.receivedDate ?? "").localeCompare(String(b.receivedDate ?? ""))),
            serials
        };
    }
    async listSerialMovements(user, query) {
        const db = this.prisma;
        if (!db.serialNumberMovement)
            return [];
        const where = { companyId: user.companyId };
        if (query.itemId)
            where.itemId = query.itemId;
        if (query.voucherId)
            where.voucherId = query.voucherId;
        if (query.serialNo)
            where.serialNo = { contains: query.serialNo, mode: "insensitive" };
        return db.serialNumberMovement.findMany({
            where,
            orderBy: [{ movementDate: "desc" }, { createdAt: "desc" }],
            take: query.take ?? 200
        }).catch((error) => {
            if (this.isMissingInventoryTableError(error))
                return [];
            throw error;
        });
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map