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
exports.ItemsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const inventory_service_1 = require("../inventory/inventory.service");
const itemInclude = {
    group: true,
    incomeAccount: true,
    expenseAccount: true,
    taxCode: true,
    itemTaxCodes: { include: { taxCode: true } },
    uomConversions: true,
    components: { include: { component: true } }
};
let ItemsService = class ItemsService {
    prisma;
    inventory;
    constructor(prisma, inventory) {
        this.prisma = prisma;
        this.inventory = inventory;
    }
    async create(user, input) {
        const name = input.name?.trim();
        if (!name)
            throw new common_1.BadRequestException("Item name is required");
        await this.ensureUniqueName(user.companyId, name);
        await this.validateRelations(user.companyId, input);
        const type = input.type ?? "goods";
        const taxCodeIds = this.taxCodeIds(input);
        const openingQty = new client_1.Prisma.Decimal(type === "goods" ? input.openingQty ?? 0 : 0);
        const openingRate = new client_1.Prisma.Decimal(input.openingPrice ?? input.purchasePrice ?? 0);
        const inventoryPolicy = await this.resolveInventoryPolicy(user.companyId, input, type);
        return this.prisma.$transaction(async (tx) => {
            const item = await tx.item.create({
                data: {
                    companyId: user.companyId,
                    name,
                    sku: this.clean(input.sku),
                    hsCode: this.clean(input.hsCode),
                    unit: this.clean(input.unit),
                    baseUnit: this.clean(input.baseUnit ?? input.unit),
                    type: type,
                    salesPrice: this.decimalOrNull(input.salesPrice),
                    purchasePrice: this.decimalOrNull(input.purchasePrice),
                    reorderLevel: this.decimalOrZero(input.reorderLevel),
                    safetyStock: this.decimalOrZero(input.safetyStock),
                    groupId: input.groupId ?? null,
                    incomeAccountId: input.incomeAccountId ?? null,
                    expenseAccountId: input.expenseAccountId ?? null,
                    taxCodeId: input.taxCodeId ?? taxCodeIds[0] ?? null,
                    minStockLevel: this.decimalOrNull(input.minStockLevel),
                    reorderQty: this.decimalOrNull(input.reorderQty),
                    trackInventory: inventoryPolicy.trackInventory,
                    isSerialized: inventoryPolicy.isSerialized,
                    isKit: inventoryPolicy.isKit,
                    tracksBatch: inventoryPolicy.tracksBatch,
                    tracksLot: inventoryPolicy.tracksLot,
                    tracksExpiry: inventoryPolicy.tracksExpiry,
                    itemTaxCodes: taxCodeIds.length
                        ? { create: taxCodeIds.map((taxCodeId) => ({ taxCodeId })) }
                        : undefined,
                    uomConversions: input.uomConversions?.length
                        ? { create: this.normalizeUomConversions(input) }
                        : undefined,
                    components: input.components?.length
                        ? { create: input.components.map((c) => ({ companyId: user.companyId, componentId: c.componentId, qty: new client_1.Prisma.Decimal(c.qty) })) }
                        : undefined
                },
                include: itemInclude
            });
            if (openingQty.gt(0)) {
                const ledger = await tx.stockLedger.create({
                    data: {
                        companyId: user.companyId,
                        itemId: item.id,
                        date: new Date(),
                        voucherId: null,
                        sourceDocumentType: "opening",
                        sourceDocumentId: item.id,
                        qtyIn: openingQty,
                        qtyOut: new client_1.Prisma.Decimal(0),
                        rate: openingRate,
                        amount: openingQty.mul(openingRate)
                    }
                });
                await this.inventory.receiveInventoryLayer(tx, {
                    companyId: user.companyId,
                    itemId: item.id,
                    qty: openingQty,
                    unitCost: openingRate,
                    date: ledger.date,
                    sourceLedgerId: ledger.id,
                    sourceVoucherId: null,
                    sourceType: "opening"
                });
            }
            return item;
        });
    }
    async update(user, id, input) {
        const item = await this.findOwned(user.companyId, id);
        if (input.name?.trim() && input.name.trim() !== item.name) {
            await this.ensureUniqueName(user.companyId, input.name.trim(), id);
        }
        await this.validateRelations(user.companyId, input, id);
        const inventoryPolicy = await this.resolveInventoryPolicy(user.companyId, input, input.type ?? item.type, item);
        const taxCodeIds = input.taxCodeIds || input.taxCodeId !== undefined ? this.taxCodeIds(input) : null;
        return this.prisma.$transaction(async (tx) => {
            if (taxCodeIds) {
                await tx.itemTaxCode.deleteMany({ where: { itemId: id } });
                if (taxCodeIds.length) {
                    await tx.itemTaxCode.createMany({
                        data: taxCodeIds.map((taxCodeId) => ({ itemId: id, taxCodeId })),
                        skipDuplicates: true
                    });
                }
            }
            if (input.uomConversions) {
                await tx.itemUomConversion.deleteMany({ where: { itemId: id } });
                if (input.uomConversions.length) {
                    await tx.itemUomConversion.createMany({
                        data: this.normalizeUomConversions(input).map((u) => ({ ...u, itemId: id })),
                        skipDuplicates: true
                    });
                }
            }
            if (input.components) {
                await tx.itemComponent.deleteMany({ where: { parentId: id } });
                if (input.components.length) {
                    await tx.itemComponent.createMany({
                        data: input.components.map((c) => ({
                            companyId: user.companyId,
                            parentId: id,
                            componentId: c.componentId,
                            qty: new client_1.Prisma.Decimal(c.qty)
                        }))
                    });
                }
            }
            return tx.item.update({
                where: { id },
                data: this.updateData(input, taxCodeIds, inventoryPolicy),
                include: itemInclude
            });
        });
    }
    async get(user, id) {
        const item = await this.prisma.item.findFirst({
            where: { id, companyId: user.companyId },
            include: itemInclude
        });
        if (!item)
            throw new common_1.NotFoundException("Item not found");
        return item;
    }
    async list(user, filters) {
        const where = { companyId: user.companyId };
        if (filters.isActive !== undefined)
            where.isActive = filters.isActive;
        if (filters.type)
            where.type = filters.type;
        if (filters.q) {
            where.OR = [
                { name: { contains: filters.q, mode: "insensitive" } },
                { sku: { contains: filters.q, mode: "insensitive" } },
                { hsCode: { contains: filters.q, mode: "insensitive" } }
            ];
        }
        return this.prisma.item.findMany({
            where,
            include: itemInclude,
            orderBy: { name: "asc" },
            skip: filters.skip ?? 0,
            take: filters.take ?? 200
        });
    }
    async remove(user, id) {
        await this.findOwned(user.companyId, id);
        return this.prisma.item.update({ where: { id }, data: { isActive: false } });
    }
    async restore(user, id) {
        await this.findOwned(user.companyId, id);
        return this.prisma.item.update({ where: { id }, data: { isActive: true } });
    }
    async assemble(user, id, qty, memo, components, sundries) {
        const kit = await this.getKit(user.companyId, id);
        const quantity = new client_1.Prisma.Decimal(qty);
        if (quantity.lte(0))
            throw new common_1.BadRequestException("Quantity must be positive");
        const componentRows = components?.length
            ? components.map((c) => ({ componentId: c.componentId, qty: new client_1.Prisma.Decimal(c.consumedQty) }))
            : kit.components.map((c) => ({ componentId: c.componentId, qty: c.qty.mul(quantity) }));
        return this.prisma.$transaction(async (tx) => {
            const settings = await this.inventory.getOrCreateSettings(user.companyId, tx);
            const voucher = await tx.voucher.create({
                data: {
                    companyId: user.companyId,
                    voucherType: client_1.VoucherType.journal,
                    status: client_1.VoucherStatus.posted,
                    voucherDate: new Date(),
                    memo: memo || `Assembly: ${kit.name}`,
                    postedAt: new Date(),
                    postedByUserId: user.sub
                }
            });
            let finishedCost = new client_1.Prisma.Decimal(0);
            for (const c of componentRows) {
                const componentCost = await this.inventory.consumeInventoryCost(tx, {
                    companyId: user.companyId,
                    itemId: c.componentId,
                    qty: c.qty,
                    costingMethod: settings.costingMethod,
                    allowNegative: settings.allowNegativeStock
                });
                finishedCost = finishedCost.add(componentCost.amount);
                await tx.stockLedger.create({
                    data: {
                        companyId: user.companyId,
                        itemId: c.componentId,
                        date: new Date(),
                        voucherId: voucher.id,
                        sourceDocumentType: "assembly",
                        sourceDocumentId: voucher.id,
                        qtyIn: new client_1.Prisma.Decimal(0),
                        qtyOut: c.qty,
                        rate: componentCost.unitCost,
                        amount: componentCost.amount
                    }
                });
            }
            const rate = quantity.gt(0) ? finishedCost.div(quantity) : new client_1.Prisma.Decimal(0);
            const ledger = await tx.stockLedger.create({
                data: {
                    companyId: user.companyId,
                    itemId: kit.id,
                    date: new Date(),
                    voucherId: voucher.id,
                    sourceDocumentType: "assembly",
                    sourceDocumentId: voucher.id,
                    qtyIn: quantity,
                    qtyOut: new client_1.Prisma.Decimal(0),
                    rate,
                    amount: quantity.mul(rate)
                }
            });
            await this.inventory.receiveInventoryLayer(tx, {
                companyId: user.companyId,
                itemId: kit.id,
                qty: quantity,
                unitCost: rate,
                date: ledger.date,
                sourceLedgerId: ledger.id,
                sourceVoucherId: voucher.id,
                sourceType: "assembly"
            });
            return { ok: true, voucherId: voucher.id, sundries: sundries ?? [] };
        });
    }
    async disassemble(user, id, qty, components, sundries) {
        const kit = await this.getKit(user.companyId, id);
        const quantity = new client_1.Prisma.Decimal(qty);
        if (quantity.lte(0))
            throw new common_1.BadRequestException("Quantity must be positive");
        const componentRows = components?.length
            ? components.map((c) => ({ componentId: c.componentId, qty: new client_1.Prisma.Decimal(c.consumedQty) }))
            : kit.components.map((c) => ({ componentId: c.componentId, qty: c.qty.mul(quantity) }));
        return this.prisma.$transaction(async (tx) => {
            const settings = await this.inventory.getOrCreateSettings(user.companyId, tx);
            const voucher = await tx.voucher.create({
                data: {
                    companyId: user.companyId,
                    voucherType: client_1.VoucherType.journal,
                    status: client_1.VoucherStatus.posted,
                    voucherDate: new Date(),
                    memo: `Disassembly: ${kit.name}`,
                    postedAt: new Date(),
                    postedByUserId: user.sub
                }
            });
            const kitCost = await this.inventory.consumeInventoryCost(tx, {
                companyId: user.companyId,
                itemId: kit.id,
                qty: quantity,
                costingMethod: settings.costingMethod,
                allowNegative: settings.allowNegativeStock
            });
            await tx.stockLedger.create({
                data: {
                    companyId: user.companyId,
                    itemId: kit.id,
                    date: new Date(),
                    voucherId: voucher.id,
                    sourceDocumentType: "disassembly",
                    sourceDocumentId: voucher.id,
                    qtyIn: new client_1.Prisma.Decimal(0),
                    qtyOut: quantity,
                    rate: kitCost.unitCost,
                    amount: kitCost.amount
                }
            });
            const totalComponentQty = componentRows.reduce((sum, row) => sum.add(row.qty), new client_1.Prisma.Decimal(0));
            for (const c of componentRows) {
                const allocatedAmount = totalComponentQty.gt(0) ? kitCost.amount.mul(c.qty).div(totalComponentQty) : new client_1.Prisma.Decimal(0);
                const componentRate = c.qty.gt(0) ? allocatedAmount.div(c.qty) : new client_1.Prisma.Decimal(0);
                const ledger = await tx.stockLedger.create({
                    data: {
                        companyId: user.companyId,
                        itemId: c.componentId,
                        date: new Date(),
                        voucherId: voucher.id,
                        sourceDocumentType: "disassembly",
                        sourceDocumentId: voucher.id,
                        qtyIn: c.qty,
                        qtyOut: new client_1.Prisma.Decimal(0),
                        rate: componentRate,
                        amount: allocatedAmount
                    }
                });
                await this.inventory.receiveInventoryLayer(tx, {
                    companyId: user.companyId,
                    itemId: c.componentId,
                    qty: c.qty,
                    unitCost: componentRate,
                    date: ledger.date,
                    sourceLedgerId: ledger.id,
                    sourceVoucherId: voucher.id,
                    sourceType: "disassembly"
                });
            }
            return { ok: true, voucherId: voucher.id, sundries: sundries ?? [] };
        });
    }
    async findOwned(companyId, id) {
        const item = await this.prisma.item.findFirst({ where: { id, companyId } });
        if (!item)
            throw new common_1.NotFoundException("Item not found");
        return item;
    }
    async getInventorySettings(companyId) {
        const db = this.prisma;
        const existing = await db.inventorySettings.findUnique({ where: { companyId } });
        if (existing)
            return existing;
        return db.inventorySettings.create({ data: { companyId } });
    }
    async resolveInventoryPolicy(companyId, input, type, existing) {
        const settings = await this.getInventorySettings(companyId);
        const next = {
            trackInventory: type === "goods" && settings.inventoryTrackingEnabled
                ? input.trackInventory ?? existing?.trackInventory ?? true
                : false,
            isSerialized: input.isSerialized ?? existing?.isSerialized ?? false,
            isKit: input.isKit ?? existing?.isKit ?? false,
            tracksBatch: input.tracksBatch ?? existing?.tracksBatch ?? false,
            tracksLot: input.tracksLot ?? existing?.tracksLot ?? false,
            tracksExpiry: input.tracksExpiry ?? existing?.tracksExpiry ?? false
        };
        if (type === "services") {
            if (next.isSerialized || next.isKit || next.tracksBatch || next.tracksLot || next.tracksExpiry) {
                throw new common_1.BadRequestException("Service items cannot use inventory tracking features");
            }
            return { ...next, trackInventory: false };
        }
        if (!next.trackInventory) {
            if (next.isSerialized || next.tracksBatch || next.tracksLot || next.tracksExpiry) {
                throw new common_1.BadRequestException("Enable item stock tracking before enabling serial, batch, lot, or expiry policy");
            }
            if (input.openingQty && input.openingQty > 0) {
                throw new common_1.BadRequestException("Opening stock requires item stock tracking");
            }
        }
        if (next.isSerialized && !settings.serialTrackingEnabled) {
            throw new common_1.BadRequestException("Enable serial tracking in inventory configuration before creating serialized items");
        }
        if (next.isKit && !settings.kitsEnabled) {
            throw new common_1.BadRequestException("Enable kits in inventory configuration before creating kit items");
        }
        if (next.tracksBatch && !settings.batchTrackingEnabled) {
            throw new common_1.BadRequestException("Enable batch tracking in inventory configuration before creating batch-tracked items");
        }
        if (next.tracksLot && !settings.lotTrackingEnabled) {
            throw new common_1.BadRequestException("Enable lot tracking in inventory configuration before creating lot-tracked items");
        }
        if (next.tracksExpiry && !settings.expiryTrackingEnabled) {
            throw new common_1.BadRequestException("Enable expiry tracking in inventory configuration before creating expiry-tracked items");
        }
        return next;
    }
    async getKit(companyId, id) {
        const kit = await this.prisma.item.findFirst({
            where: { id, companyId },
            include: { components: true }
        });
        if (!kit)
            throw new common_1.NotFoundException("Item not found");
        if (!kit.isKit)
            throw new common_1.BadRequestException("Item is not a kit");
        return kit;
    }
    async ensureUniqueName(companyId, name, excludeId) {
        const existing = await this.prisma.item.findFirst({
            where: { companyId, name: { equals: name, mode: "insensitive" }, NOT: excludeId ? { id: excludeId } : undefined }
        });
        if (existing)
            throw new common_1.BadRequestException("Item already exists");
    }
    async validateRelations(companyId, input, itemId) {
        if (input.groupId && !(await this.prisma.itemGroup.findFirst({ where: { id: input.groupId, companyId } }))) {
            throw new common_1.BadRequestException("Invalid item group");
        }
        const accountIds = [input.incomeAccountId, input.expenseAccountId].filter(Boolean);
        if (accountIds.length) {
            const count = await this.prisma.chartOfAccount.count({ where: { id: { in: accountIds }, companyId } });
            if (count !== new Set(accountIds).size)
                throw new common_1.BadRequestException("Invalid account");
        }
        const taxCodeIds = this.taxCodeIds(input);
        if (taxCodeIds.length) {
            const count = await this.prisma.taxCode.count({ where: { id: { in: taxCodeIds }, companyId } });
            if (count !== taxCodeIds.length)
                throw new common_1.BadRequestException("Invalid tax code");
        }
        const componentIds = Array.from(new Set(input.components?.map((c) => c.componentId) ?? []));
        if (componentIds.length) {
            if (itemId && componentIds.includes(itemId))
                throw new common_1.BadRequestException("Kit cannot include itself");
            const count = await this.prisma.item.count({ where: { id: { in: componentIds }, companyId } });
            if (count !== componentIds.length)
                throw new common_1.BadRequestException("Invalid kit component");
        }
    }
    updateData(input, taxCodeIds, inventoryPolicy) {
        return {
            name: input.name?.trim(),
            sku: input.sku !== undefined ? this.clean(input.sku) : undefined,
            hsCode: input.hsCode !== undefined ? this.clean(input.hsCode) : undefined,
            unit: input.unit !== undefined ? this.clean(input.unit) : undefined,
            baseUnit: input.baseUnit !== undefined ? this.clean(input.baseUnit) : undefined,
            type: input.type,
            salesPrice: input.salesPrice !== undefined ? this.decimalOrNull(input.salesPrice) : undefined,
            purchasePrice: input.purchasePrice !== undefined ? this.decimalOrNull(input.purchasePrice) : undefined,
            reorderLevel: input.reorderLevel !== undefined ? this.decimalOrZero(input.reorderLevel) : undefined,
            safetyStock: input.safetyStock !== undefined ? this.decimalOrZero(input.safetyStock) : undefined,
            group: input.groupId !== undefined ? (input.groupId ? { connect: { id: input.groupId } } : { disconnect: true }) : undefined,
            incomeAccount: input.incomeAccountId !== undefined ? (input.incomeAccountId ? { connect: { id: input.incomeAccountId } } : { disconnect: true }) : undefined,
            expenseAccount: input.expenseAccountId !== undefined ? (input.expenseAccountId ? { connect: { id: input.expenseAccountId } } : { disconnect: true }) : undefined,
            taxCode: taxCodeIds ? (taxCodeIds[0] ? { connect: { id: taxCodeIds[0] } } : { disconnect: true }) : undefined,
            minStockLevel: input.minStockLevel !== undefined ? this.decimalOrNull(input.minStockLevel) : undefined,
            reorderQty: input.reorderQty !== undefined ? this.decimalOrNull(input.reorderQty) : undefined,
            trackInventory: inventoryPolicy.trackInventory,
            isSerialized: inventoryPolicy.isSerialized,
            isKit: inventoryPolicy.isKit,
            tracksBatch: inventoryPolicy.tracksBatch,
            tracksLot: inventoryPolicy.tracksLot,
            tracksExpiry: inventoryPolicy.tracksExpiry,
            isActive: input.isActive
        };
    }
    taxCodeIds(input) {
        return Array.from(new Set([...(input.taxCodeIds ?? []), input.taxCodeId].filter(Boolean)));
    }
    normalizeUomConversions(input) {
        return (input.uomConversions ?? []).map((u) => ({
            unit: u.unit.trim(),
            factor: new client_1.Prisma.Decimal(u.factor),
            isBase: u.isBase ?? u.unit === (input.baseUnit ?? input.unit)
        }));
    }
    clean(value) {
        const trimmed = value?.trim();
        return trimmed || null;
    }
    decimalOrNull(value) {
        return value === undefined || value === null ? null : new client_1.Prisma.Decimal(value);
    }
    decimalOrZero(value) {
        return new client_1.Prisma.Decimal(value ?? 0);
    }
};
exports.ItemsService = ItemsService;
exports.ItemsService = ItemsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        inventory_service_1.InventoryService])
], ItemsService);
//# sourceMappingURL=items.service.js.map