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
let ItemsService = class ItemsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async validateRefs(companyId, input) {
        const ids = [
            input.incomeAccountId,
            input.expenseAccountId
        ].filter(Boolean);
        if (ids.length) {
            const accounts = await this.prisma.chartOfAccount.findMany({
                where: { id: { in: ids }, companyId }
            });
            if (accounts.length !== ids.length)
                throw new common_1.BadRequestException("Invalid account");
        }
        const groupId = input.groupId;
        if (groupId) {
            const group = await this.prisma.itemGroup.findFirst({ where: { id: groupId, companyId } });
            if (!group)
                throw new common_1.BadRequestException("Invalid group");
        }
        const taxCodeId = input.taxCodeId;
        const taxCodeIds = input.taxCodeIds;
        const allTaxIds = [
            ...(taxCodeId ? [taxCodeId] : []),
            ...(Array.isArray(taxCodeIds) ? taxCodeIds : [])
        ];
        if (allTaxIds.length) {
            const tax = await this.prisma.taxCode.findMany({
                where: { id: { in: allTaxIds }, companyId }
            });
            if (tax.length !== new Set(allTaxIds).size)
                throw new common_1.BadRequestException("Invalid tax code");
        }
    }
    async create(user, input) {
        const sku = typeof input.sku === "string" ? input.sku.trim() : undefined;
        if (sku) {
            const existingSku = await this.prisma.item.findFirst({
                where: {
                    companyId: user.companyId,
                    sku: { equals: sku, mode: "insensitive" }
                }
            });
            if (existingSku)
                throw new common_1.BadRequestException("SKU/Unique ID already exists");
        }
        await this.validateRefs(user.companyId, input);
        const taxCodeIds = input.taxCodeIds;
        const uomConversions = input.uomConversions;
        const openingQty = input.openingQty;
        const openingPrice = input.openingPrice;
        const created = await this.prisma.item.create({
            data: {
                companyId: user.companyId,
                name: input.name,
                sku,
                hsCode: input.hsCode,
                groupId: input.groupId,
                unit: input.unit,
                baseUnit: input.baseUnit ?? input.unit ?? null,
                type: input.type ?? "goods",
                salesPrice: input.salesPrice,
                purchasePrice: input.purchasePrice,
                reorderLevel: input.reorderLevel ?? 0,
                safetyStock: input.safetyStock ?? 0,
                minStockLevel: input.minStockLevel ?? null,
                reorderQty: input.reorderQty ?? null,
                isSerialized: input.isSerialized ?? false,
                isKit: input.isKit ?? false,
                incomeAccountId: input.incomeAccountId,
                expenseAccountId: input.expenseAccountId,
                taxCodeId: input.taxCodeId,
                itemTaxCodes: Array.isArray(taxCodeIds) && taxCodeIds.length
                    ? {
                        create: taxCodeIds.map((id) => ({ taxCodeId: id }))
                    }
                    : undefined,
                uomConversions: Array.isArray(uomConversions) && uomConversions.length
                    ? {
                        create: uomConversions.map((c) => ({
                            unit: c.unit,
                            factor: new client_1.Prisma.Decimal(c.factor),
                            isBase: Boolean(c.isBase)
                        }))
                    }
                    : undefined
            }
        });
        const components = input.components;
        if (Array.isArray(components) && components.length) {
            await this.prisma.itemComponent.createMany({
                data: components.map((c) => ({
                    companyId: user.companyId,
                    parentId: created.id,
                    componentId: c.componentId,
                    qty: new client_1.Prisma.Decimal(c.qty)
                }))
            });
        }
        if (openingQty && openingQty !== 0 && created.type !== "services") {
            const qty = new client_1.Prisma.Decimal(openingQty);
            const rate = new client_1.Prisma.Decimal(openingPrice ?? 0);
            const amount = qty.abs().mul(rate);
            await this.prisma.stockLedger.create({
                data: {
                    companyId: user.companyId,
                    itemId: created.id,
                    date: new Date(),
                    dateBs: null,
                    voucherId: null,
                    qtyIn: qty.gt(0) ? qty : new client_1.Prisma.Decimal(0),
                    qtyOut: qty.lt(0) ? qty.abs() : new client_1.Prisma.Decimal(0),
                    rate,
                    amount
                }
            });
        }
        return created;
    }
    async update(user, id, input) {
        const item = await this.prisma.item.findFirst({ where: { id, companyId: user.companyId } });
        if (!item)
            throw new common_1.NotFoundException("Item not found");
        if (typeof input.sku === "string") {
            const nextSku = input.sku.trim();
            if (nextSku) {
                const existing = await this.prisma.item.findFirst({
                    where: {
                        companyId: user.companyId,
                        sku: { equals: nextSku, mode: "insensitive" },
                        NOT: { id }
                    }
                });
                if (existing)
                    throw new common_1.BadRequestException("SKU/Unique ID already exists");
                input.sku = nextSku;
            }
            else {
                input.sku = null;
            }
        }
        await this.validateRefs(user.companyId, input);
        const components = input.components;
        if (Array.isArray(components)) {
            await this.prisma.itemComponent.deleteMany({ where: { parentId: id } });
            if (components.length) {
                await this.prisma.itemComponent.createMany({
                    data: components.map((c) => ({
                        companyId: user.companyId,
                        parentId: id,
                        componentId: c.componentId,
                        qty: new client_1.Prisma.Decimal(c.qty)
                    }))
                });
            }
        }
        const taxCodeIds = input.taxCodeIds;
        const uomConversions = input.uomConversions;
        if (Array.isArray(taxCodeIds) || Array.isArray(uomConversions)) {
            return this.prisma.$transaction(async (tx) => {
                const updateData = { ...input };
                delete updateData.taxCodeIds;
                delete updateData.uomConversions;
                delete updateData.components;
                const updated = await tx.item.update({
                    where: { id },
                    data: updateData
                });
                if (Array.isArray(taxCodeIds)) {
                    await tx.itemTaxCode.deleteMany({ where: { itemId: id } });
                    if (taxCodeIds.length) {
                        await tx.itemTaxCode.createMany({
                            data: taxCodeIds.map((taxCodeId) => ({ itemId: id, taxCodeId }))
                        });
                    }
                }
                if (Array.isArray(uomConversions)) {
                    await tx.itemUomConversion.deleteMany({ where: { itemId: id } });
                    if (uomConversions.length) {
                        await tx.itemUomConversion.createMany({
                            data: uomConversions.map((c) => ({
                                itemId: id,
                                unit: c.unit,
                                factor: new client_1.Prisma.Decimal(c.factor),
                                isBase: Boolean(c.isBase)
                            }))
                        });
                    }
                }
                return updated;
            });
        }
        const updateData = { ...input };
        delete updateData.components;
        return this.prisma.item.update({
            where: { id },
            data: updateData
        });
    }
    async get(user, id) {
        const item = await this.prisma.item.findFirst({
            where: { id, companyId: user.companyId },
            include: {
                components: {
                    include: { component: { select: { id: true, name: true, sku: true, unit: true } } }
                },
                itemTaxCodes: { include: { taxCode: true } },
                uomConversions: true,
            }
        });
        if (!item)
            throw new common_1.NotFoundException("Item not found");
        const ledger = await this.prisma.stockLedger.aggregate({
            where: { companyId: user.companyId, itemId: id },
            _sum: { qtyIn: true, qtyOut: true }
        });
        const stock = (Number(ledger._sum.qtyIn || 0)) - (Number(ledger._sum.qtyOut || 0));
        const minStock = item.minStockLevel ? Number(item.minStockLevel) : null;
        return { ...item, stock, isLowStock: minStock !== null && stock < minStock };
    }
    async list(user, filters) {
        const where = { companyId: user.companyId };
        if (filters.isActive !== undefined)
            where.isActive = filters.isActive;
        if (filters.q) {
            where.OR = [
                { name: { contains: filters.q, mode: "insensitive" } },
                { sku: { contains: filters.q, mode: "insensitive" } }
            ];
        }
        if (filters.type)
            where.type = filters.type;
        const items = await this.prisma.item.findMany({
            where,
            orderBy: { name: "asc" },
            skip: filters.skip || 0,
            take: filters.take || 1000
        });
        const ledger = await this.prisma.stockLedger.groupBy({
            by: ["itemId"],
            where: { companyId: user.companyId },
            _sum: {
                qtyIn: true,
                qtyOut: true
            }
        });
        const stockMap = new Map();
        for (const group of ledger) {
            const inQty = Number(group._sum.qtyIn || 0);
            const outQty = Number(group._sum.qtyOut || 0);
            stockMap.set(group.itemId, inQty - outQty);
        }
        return items.map((item) => {
            const stock = item.type === "services" ? 0 : (stockMap.get(item.id) || 0);
            const minStock = item.minStockLevel ? Number(item.minStockLevel) : null;
            return {
                ...item,
                stock,
                isLowStock: minStock !== null && stock < minStock
            };
        });
    }
    async assemble(user, parentId, qty, memo) {
        const item = await this.prisma.item.findFirst({
            where: { id: parentId, companyId: user.companyId, isKit: true },
            include: { components: true }
        });
        if (!item)
            throw new common_1.NotFoundException("Kit item not found");
        if (!item.components.length)
            throw new common_1.BadRequestException("Kit has no components defined");
        return this.prisma.$transaction(async (tx) => {
            let totalKitCost = 0;
            for (const comp of item.components) {
                const compQty = Number(comp.qty) * qty;
                const compLedger = await tx.stockLedger.groupBy({
                    by: ["itemId"],
                    where: { companyId: user.companyId, itemId: comp.componentId },
                    _sum: { qtyIn: true, qtyOut: true }
                });
                const allEntries = await tx.stockLedger.findMany({
                    where: { companyId: user.companyId, itemId: comp.componentId },
                    select: { qtyIn: true, qtyOut: true, amount: true }
                });
                let totalQty = 0;
                let totalValue = 0;
                for (const entry of allEntries) {
                    const qIn = Number(entry.qtyIn || 0);
                    const qOut = Number(entry.qtyOut || 0);
                    const amt = Number(entry.amount || 0);
                    if (qIn > 0) {
                        totalQty += qIn;
                        totalValue += amt;
                    }
                    if (qOut > 0) {
                        totalQty -= qOut;
                        totalValue -= amt;
                    }
                }
                const avgCost = totalQty > 0 ? (totalValue / totalQty) : 0;
                const compAmount = compQty * avgCost;
                totalKitCost += compAmount;
                await tx.stockLedger.create({
                    data: {
                        companyId: user.companyId,
                        itemId: comp.componentId,
                        date: new Date(),
                        qtyIn: 0,
                        qtyOut: compQty,
                        rate: avgCost,
                        amount: compAmount
                    }
                });
            }
            const kitRate = qty > 0 ? (totalKitCost / qty) : 0;
            await tx.stockLedger.create({
                data: {
                    companyId: user.companyId,
                    itemId: parentId,
                    date: new Date(),
                    qtyIn: qty,
                    qtyOut: 0,
                    rate: kitRate,
                    amount: totalKitCost
                }
            });
        });
    }
    async disassemble(user, parentId, qty) {
        const item = await this.prisma.item.findFirst({
            where: { id: parentId, companyId: user.companyId, isKit: true },
            include: { components: true }
        });
        if (!item)
            throw new common_1.NotFoundException("Kit item not found");
        if (!item.components.length)
            throw new common_1.BadRequestException("Kit has no components defined");
        return this.prisma.$transaction(async (tx) => {
            const allEntries = await tx.stockLedger.findMany({
                where: { companyId: user.companyId, itemId: parentId },
                select: { qtyIn: true, qtyOut: true, amount: true }
            });
            let totalKitQty = 0;
            let totalKitValue = 0;
            for (const entry of allEntries) {
                const qIn = Number(entry.qtyIn || 0);
                const qOut = Number(entry.qtyOut || 0);
                const amt = Number(entry.amount || 0);
                if (qIn > 0) {
                    totalKitQty += qIn;
                    totalKitValue += amt;
                }
                if (qOut > 0) {
                    totalKitQty -= qOut;
                    totalKitValue -= amt;
                }
            }
            const avgKitCost = totalKitQty > 0 ? (totalKitValue / totalKitQty) : 0;
            const totalDisassembledCost = avgKitCost * qty;
            await tx.stockLedger.create({
                data: {
                    companyId: user.companyId,
                    itemId: parentId,
                    date: new Date(),
                    qtyIn: 0,
                    qtyOut: qty,
                    rate: avgKitCost,
                    amount: totalDisassembledCost
                }
            });
            const totalComponentUnits = item.components.reduce((sum, c) => sum + Number(c.qty), 0);
            for (const comp of item.components) {
                const compQty = Number(comp.qty) * qty;
                const costFraction = totalComponentUnits > 0 ? (Number(comp.qty) / totalComponentUnits) : 0;
                const compAmount = totalDisassembledCost * costFraction;
                const compRate = compQty > 0 ? (compAmount / compQty) : 0;
                await tx.stockLedger.create({
                    data: {
                        companyId: user.companyId,
                        itemId: comp.componentId,
                        date: new Date(),
                        qtyIn: compQty,
                        qtyOut: 0,
                        rate: compRate,
                        amount: compAmount
                    }
                });
            }
        });
    }
    async remove(user, id) {
        const item = await this.prisma.item.findFirst({ where: { id, companyId: user.companyId } });
        if (!item)
            throw new common_1.NotFoundException("Item not found");
        const usage = await this.prisma.voucherLine.count({
            where: { companyId: user.companyId, itemId: id }
        });
        if (usage > 0)
            throw new common_1.BadRequestException("Item is referenced by vouchers");
        return this.prisma.item.update({
            where: { id },
            data: { isActive: false }
        });
    }
    async restore(user, id) {
        const item = await this.prisma.item.findFirst({ where: { id, companyId: user.companyId } });
        if (!item)
            throw new common_1.NotFoundException("Item not found");
        return this.prisma.item.update({
            where: { id },
            data: { isActive: true }
        });
    }
};
exports.ItemsService = ItemsService;
exports.ItemsService = ItemsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ItemsService);
//# sourceMappingURL=items.service.js.map