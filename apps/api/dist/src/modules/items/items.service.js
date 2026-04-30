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
        const existing = await this.prisma.item.findFirst({
            where: {
                companyId: user.companyId,
                name: { equals: input.name, mode: "insensitive" }
            }
        });
        if (existing)
            throw new common_1.BadRequestException("Item name already exists");
        await this.validateRefs(user.companyId, input);
        const taxCodeIds = input.taxCodeIds;
        const uomConversions = input.uomConversions;
        const openingQty = input.openingQty;
        const openingPrice = input.openingPrice;
        const created = await this.prisma.item.create({
            data: {
                companyId: user.companyId,
                name: input.name,
                sku: input.sku,
                hsCode: input.hsCode,
                groupId: input.groupId,
                unit: input.unit,
                baseUnit: input.baseUnit ?? input.unit ?? null,
                type: input.type ?? "goods",
                salesPrice: input.salesPrice,
                purchasePrice: input.purchasePrice,
                reorderLevel: input.reorderLevel ?? 0,
                safetyStock: input.safetyStock ?? 0,
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
        if (input.name) {
            const existing = await this.prisma.item.findFirst({
                where: {
                    companyId: user.companyId,
                    name: { equals: String(input.name), mode: "insensitive" },
                    NOT: { id }
                }
            });
            if (existing)
                throw new common_1.BadRequestException("Item name already exists");
        }
        await this.validateRefs(user.companyId, input);
        const taxCodeIds = input.taxCodeIds;
        const uomConversions = input.uomConversions;
        if (Array.isArray(taxCodeIds) || Array.isArray(uomConversions)) {
            return this.prisma.$transaction(async (tx) => {
                const updated = await tx.item.update({
                    where: { id },
                    data: input
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
        return this.prisma.item.update({
            where: { id },
            data: input
        });
    }
    async get(user, id) {
        const item = await this.prisma.item.findFirst({ where: { id, companyId: user.companyId } });
        if (!item)
            throw new common_1.NotFoundException("Item not found");
        return item;
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
        return items.map((item) => ({
            ...item,
            stock: item.type === "services" ? 0 : (stockMap.get(item.id) || 0)
        }));
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