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
        const taxCodeId = input.taxCodeId;
        if (taxCodeId) {
            const tax = await this.prisma.taxCode.findFirst({ where: { id: taxCodeId, companyId } });
            if (!tax)
                throw new common_1.BadRequestException("Invalid tax code");
        }
    }
    async create(user, input) {
        await this.validateRefs(user.companyId, input);
        return this.prisma.item.create({
            data: {
                companyId: user.companyId,
                name: input.name,
                sku: input.sku,
                unit: input.unit,
                salesPrice: input.salesPrice,
                purchasePrice: input.purchasePrice,
                incomeAccountId: input.incomeAccountId,
                expenseAccountId: input.expenseAccountId,
                taxCodeId: input.taxCodeId
            }
        });
    }
    async update(user, id, input) {
        const item = await this.prisma.item.findFirst({ where: { id, companyId: user.companyId } });
        if (!item)
            throw new common_1.NotFoundException("Item not found");
        await this.validateRefs(user.companyId, input);
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
        if (filters.q)
            where.name = { contains: filters.q, mode: "insensitive" };
        return this.prisma.item.findMany({
            where,
            orderBy: { name: "asc" },
            skip: filters.skip || 0,
            take: filters.take || 50
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
};
exports.ItemsService = ItemsService;
exports.ItemsService = ItemsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ItemsService);
//# sourceMappingURL=items.service.js.map