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
    async getStock(user, itemId, filters) {
        const item = await this.prisma.item.findFirst({
            where: { id: itemId, companyId: user.companyId }
        });
        if (!item)
            throw new common_1.BadRequestException("Item not found");
        const where = { companyId: user.companyId, itemId };
        if (filters.from || filters.to) {
            where.date = {};
            if (filters.from)
                where.date.gte = filters.from;
            if (filters.to)
                where.date.lte = filters.to;
        }
        const entries = await this.prisma.stockLedger.findMany({
            where,
            orderBy: { date: "asc" }
        });
        let qty = new client_1.Prisma.Decimal(0);
        for (const e of entries) {
            qty = qty.add(e.qtyIn).sub(e.qtyOut);
        }
        return { itemId, qty, entries };
    }
    async adjustStock(user, input) {
        const item = await this.prisma.item.findFirst({
            where: { id: input.itemId, companyId: user.companyId }
        });
        if (!item)
            throw new common_1.BadRequestException("Item not found");
        const account = await this.prisma.chartOfAccount.findFirst({
            where: { id: input.accountId, companyId: user.companyId }
        });
        if (!account)
            throw new common_1.BadRequestException("Account not found");
        const inventoryAccountId = item.expenseAccountId || item.incomeAccountId;
        if (!inventoryAccountId)
            throw new common_1.BadRequestException("Item missing inventory account");
        const qty = new client_1.Prisma.Decimal(input.qty);
        if (qty.equals(0))
            throw new common_1.BadRequestException("Quantity cannot be zero");
        const rate = new client_1.Prisma.Decimal(input.rate ?? 0);
        const amount = qty.abs().mul(rate);
        const resolved = (0, nepali_date_1.resolveAdDate)(input.date, input.dateBs);
        return this.prisma.$transaction(async (tx) => {
            const voucher = await tx.voucher.create({
                data: {
                    companyId: user.companyId,
                    voucherType: client_1.VoucherType.journal,
                    status: client_1.VoucherStatus.posted,
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
                                    credit: new client_1.Prisma.Decimal(0),
                                    description: "Stock increase"
                                },
                                {
                                    companyId: user.companyId,
                                    lineNo: 2,
                                    accountId: account.id,
                                    debit: new client_1.Prisma.Decimal(0),
                                    credit: amount,
                                    description: "Stock increase offset"
                                }
                            ]
                            : [
                                {
                                    companyId: user.companyId,
                                    lineNo: 1,
                                    accountId: account.id,
                                    debit: new client_1.Prisma.Decimal(0),
                                    credit: amount,
                                    description: "Stock decrease"
                                },
                                {
                                    companyId: user.companyId,
                                    lineNo: 2,
                                    accountId: inventoryAccountId,
                                    debit: amount,
                                    credit: new client_1.Prisma.Decimal(0),
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
                    qtyIn: qty.gt(0) ? qty : new client_1.Prisma.Decimal(0),
                    qtyOut: qty.lt(0) ? qty.abs() : new client_1.Prisma.Decimal(0),
                    rate,
                    amount
                }
            });
            return { ok: true, voucherId: voucher.id };
        });
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map