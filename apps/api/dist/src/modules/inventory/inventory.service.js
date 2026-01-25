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
        if (item.type === "services") {
            return { itemId, qty: new client_1.Prisma.Decimal(0), entries: [] };
        }
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
        if (item.type === "services") {
            throw new common_1.BadRequestException("Service items do not track stock");
        }
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
            ? { companyId: user.companyId, date: { lt: filters.from } }
            : null;
        const [periodEntries, openingEntries] = await Promise.all([
            this.prisma.stockLedger.findMany({ where: periodWhere }),
            openingWhere ? this.prisma.stockLedger.findMany({ where: openingWhere }) : Promise.resolve([])
        ]);
        const zero = new client_1.Prisma.Decimal(0);
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
            if (item.type === "services") {
                return {
                    id: item.id,
                    name: item.name,
                    sku: item.sku,
                    hsCode: item.hsCode ?? null,
                    unit: item.unit,
                    type: item.type ?? "services",
                    parentGroup: item.group?.name ?? item.incomeAccount?.name ?? item.expenseAccount?.name ?? "—",
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
                parentGroup: item.group?.name ?? item.incomeAccount?.name ?? item.expenseAccount?.name ?? "—",
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
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map