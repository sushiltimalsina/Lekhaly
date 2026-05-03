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
exports.TaxesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const nepali_date_1 = require("../../common/date/nepali-date");
let TaxesService = class TaxesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(user, filters) {
        const where = { companyId: user.companyId };
        if (filters.isActive !== undefined)
            where.isActive = filters.isActive;
        if (filters.q)
            where.name = { contains: filters.q, mode: "insensitive" };
        return this.prisma.taxCode.findMany({
            where,
            orderBy: [{ sortOrder: "asc" }, { name: "desc" }]
        });
    }
    async updateSortOrder(user, data) {
        const queries = data.map((item) => this.prisma.taxCode.update({
            where: { id: item.id, companyId: user.companyId },
            data: { sortOrder: item.sortOrder },
        }));
        await this.prisma.$transaction(queries);
        return { success: true };
    }
    async get(user, id) {
        const tax = await this.prisma.taxCode.findFirst({ where: { id, companyId: user.companyId } });
        if (!tax)
            throw new common_1.NotFoundException("Tax code not found");
        return tax;
    }
    async create(user, input) {
        return this.prisma.taxCode.create({
            data: {
                companyId: user.companyId,
                name: input.name,
                rate: new client_1.Prisma.Decimal(input.rate),
                isInclusive: Boolean(input.isInclusive),
                inputTaxAccountId: input.inputTaxAccountId,
                outputTaxAccountId: input.outputTaxAccountId
            }
        });
    }
    async update(user, id, input) {
        const tax = await this.prisma.taxCode.findFirst({ where: { id, companyId: user.companyId } });
        if (!tax)
            throw new common_1.NotFoundException("Tax code not found");
        return this.prisma.taxCode.update({
            where: { id: tax.id },
            data: {
                name: input.name ?? tax.name,
                rate: input.rate !== undefined ? new client_1.Prisma.Decimal(input.rate) : tax.rate,
                isInclusive: input.isInclusive ?? tax.isInclusive,
                inputTaxAccountId: input.inputTaxAccountId ?? tax.inputTaxAccountId,
                outputTaxAccountId: input.outputTaxAccountId ?? tax.outputTaxAccountId
            }
        });
    }
    async remove(user, id) {
        const tax = await this.prisma.taxCode.findFirst({ where: { id, companyId: user.companyId } });
        if (!tax)
            throw new common_1.NotFoundException("Tax code not found");
        return this.prisma.taxCode.update({
            where: { id: tax.id },
            data: { isActive: false }
        });
    }
    async buildVatRegister(companyId, from, to) {
        const where = {
            companyId,
            taxCodeId: { not: null },
            voucher: { status: "posted" }
        };
        if (from || to) {
            where.voucher = { status: "posted", voucherDate: {} };
            if (from)
                where.voucher.voucherDate.gte = from;
            if (to)
                where.voucher.voucherDate.lte = to;
        }
        const lines = await this.prisma.voucherLine.findMany({
            where,
            include: { voucher: true, party: true }
        });
        const rows = lines.map((line) => ({
            voucherId: line.voucherId,
            date: line.voucher.voucherDate,
            partyId: line.partyId || null,
            taxableAmount: line.debit.gt(0) ? line.debit : line.credit,
            vatAmount: line.taxAmount,
            type: line.credit.gt(0) ? "sales" : "purchase",
            taxCodeId: line.taxCodeId
        }));
        return rows;
    }
    async vatReport(user, from, to, fromBs, toBs) {
        const fromResolved = from || (fromBs ? (0, nepali_date_1.resolveAdDate)(undefined, fromBs).date : undefined);
        const toResolved = to || (toBs ? (0, nepali_date_1.resolveAdDate)(undefined, toBs).date : undefined);
        const rows = await this.buildVatRegister(user.companyId, fromResolved, toResolved);
        return { rows };
    }
    async vatSummary(user, from, to, fromBs, toBs) {
        const fromResolved = from || (fromBs ? (0, nepali_date_1.resolveAdDate)(undefined, fromBs).date : undefined);
        const toResolved = to || (toBs ? (0, nepali_date_1.resolveAdDate)(undefined, toBs).date : undefined);
        const rows = await this.buildVatRegister(user.companyId, fromResolved, toResolved);
        let totalSalesVat = new client_1.Prisma.Decimal(0);
        let totalPurchaseVat = new client_1.Prisma.Decimal(0);
        for (const row of rows) {
            if (row.type === "sales")
                totalSalesVat = totalSalesVat.add(row.vatAmount);
            if (row.type === "purchase")
                totalPurchaseVat = totalPurchaseVat.add(row.vatAmount);
        }
        return {
            totalSalesVat,
            totalPurchaseVat,
            netVat: totalSalesVat.sub(totalPurchaseVat)
        };
    }
};
exports.TaxesService = TaxesService;
exports.TaxesService = TaxesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TaxesService);
//# sourceMappingURL=taxes.service.js.map