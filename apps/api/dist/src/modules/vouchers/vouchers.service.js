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
exports.VouchersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let VouchersService = class VouchersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    normalizeLines(lines) {
        if (lines.length === 0)
            throw new common_1.BadRequestException("Lines required");
        return lines.map((line, idx) => {
            const debit = Number(line.debit || 0);
            const credit = Number(line.credit || 0);
            if (debit < 0 || credit < 0)
                throw new common_1.BadRequestException("Negative amounts not allowed");
            if ((debit > 0 && credit > 0) || (debit === 0 && credit === 0)) {
                throw new common_1.BadRequestException("Each line must have either debit or credit");
            }
            return {
                lineNo: idx + 1,
                accountId: line.accountId,
                partyId: line.partyId,
                itemId: line.itemId,
                description: line.description,
                debit: new client_1.Prisma.Decimal(debit),
                credit: new client_1.Prisma.Decimal(credit),
                taxCodeId: line.taxCodeId,
                taxAmount: new client_1.Prisma.Decimal(line.taxAmount || 0)
            };
        });
    }
    computeTotals(lines) {
        let debit = new client_1.Prisma.Decimal(0);
        let credit = new client_1.Prisma.Decimal(0);
        for (const line of lines) {
            debit = debit.add(line.debit);
            credit = credit.add(line.credit);
        }
        return { debit, credit };
    }
    async createDraft(user, input) {
        if (!input.voucherType || !input.voucherDate || !input.lines) {
            throw new common_1.BadRequestException("Missing draft fields");
        }
        const lines = this.normalizeLines(input.lines);
        const voucher = await this.prisma.voucher.create({
            data: {
                companyId: user.companyId,
                voucherType: input.voucherType,
                status: client_1.VoucherStatus.draft,
                voucherDate: input.voucherDate,
                partyId: input.partyId,
                memo: input.memo,
                createdByUserId: user.sub,
                lines: {
                    create: lines.map((l) => ({ ...l, companyId: user.companyId }))
                }
            },
            include: { lines: true }
        });
        return voucher;
    }
    async updateDraft(user, voucherId, input) {
        const voucher = await this.prisma.voucher.findFirst({
            where: { id: voucherId, companyId: user.companyId }
        });
        if (!voucher)
            throw new common_1.NotFoundException("Voucher not found");
        if (voucher.status !== client_1.VoucherStatus.draft)
            throw new common_1.ForbiddenException("Only draft vouchers can be edited");
        const data = {};
        if (input.voucherType)
            data.voucherType = input.voucherType;
        if (input.voucherDate)
            data.voucherDate = input.voucherDate;
        if (input.partyId !== undefined)
            data.partyId = input.partyId;
        if (input.memo !== undefined)
            data.memo = input.memo;
        return this.prisma.$transaction(async (tx) => {
            if (input.lines) {
                const lines = this.normalizeLines(input.lines);
                await tx.voucherLine.deleteMany({ where: { voucherId: voucher.id } });
                await tx.voucherLine.createMany({
                    data: lines.map((l) => ({ ...l, voucherId: voucher.id, companyId: user.companyId }))
                });
            }
            const updated = await tx.voucher.update({
                where: { id: voucher.id },
                data
            });
            return tx.voucher.findUnique({ where: { id: updated.id }, include: { lines: true } });
        });
    }
    async preview(user, voucherId) {
        const voucher = await this.prisma.voucher.findFirst({
            where: { id: voucherId, companyId: user.companyId },
            include: { lines: true }
        });
        if (!voucher)
            throw new common_1.NotFoundException("Voucher not found");
        const totals = this.computeTotals(voucher.lines.map((l) => ({ debit: l.debit, credit: l.credit })));
        const balanced = totals.debit.equals(totals.credit);
        return {
            voucherId: voucher.id,
            status: voucher.status,
            totalDebit: totals.debit,
            totalCredit: totals.credit,
            balanced
        };
    }
    async post(user, voucherId) {
        return this.prisma.$transaction(async (tx) => {
            const voucher = await tx.voucher.findFirst({
                where: { id: voucherId, companyId: user.companyId },
                include: { lines: true }
            });
            if (!voucher)
                throw new common_1.NotFoundException("Voucher not found");
            if (voucher.status !== client_1.VoucherStatus.draft)
                throw new common_1.ForbiddenException("Only draft vouchers can be posted");
            if (voucher.lines.length === 0)
                throw new common_1.BadRequestException("Voucher has no lines");
            const totals = this.computeTotals(voucher.lines.map((l) => ({ debit: l.debit, credit: l.credit })));
            if (!totals.debit.equals(totals.credit))
                throw new common_1.BadRequestException("Voucher not balanced");
            const company = await tx.company.findUnique({ where: { id: user.companyId } });
            if (!company)
                throw new common_1.BadRequestException("Company not found");
            const sequence = company.nextInvoiceNumber;
            const prefix = voucher.voucherType === client_1.VoucherType.sales_invoice
                ? company.invoicePrefix
                : voucher.voucherType.replace("_", "-").toUpperCase();
            const voucherNumber = `${prefix}-${sequence}`;
            const posted = await tx.voucher.update({
                where: { id: voucher.id },
                data: {
                    status: client_1.VoucherStatus.posted,
                    postedAt: new Date(),
                    postedByUserId: user.sub,
                    voucherNumber
                }
            });
            await tx.company.update({
                where: { id: company.id },
                data: { nextInvoiceNumber: sequence + 1 }
            });
            return tx.voucher.findUnique({ where: { id: posted.id }, include: { lines: true } });
        });
    }
    async void(user, voucherId) {
        return this.prisma.$transaction(async (tx) => {
            const voucher = await tx.voucher.findFirst({
                where: { id: voucherId, companyId: user.companyId },
                include: { lines: true }
            });
            if (!voucher)
                throw new common_1.NotFoundException("Voucher not found");
            if (voucher.status !== client_1.VoucherStatus.posted)
                throw new common_1.ForbiddenException("Only posted vouchers can be voided");
            const reversal = await tx.voucher.create({
                data: {
                    companyId: voucher.companyId,
                    voucherType: client_1.VoucherType.reversal,
                    status: client_1.VoucherStatus.posted,
                    voucherDate: new Date(),
                    partyId: voucher.partyId,
                    memo: `Reversal of ${voucher.voucherNumber || voucher.id}`,
                    postedAt: new Date(),
                    postedByUserId: user.sub,
                    reversalOfVoucherId: voucher.id,
                    lines: {
                        create: voucher.lines.map((l, idx) => ({
                            companyId: voucher.companyId,
                            lineNo: idx + 1,
                            accountId: l.accountId,
                            partyId: l.partyId,
                            itemId: l.itemId,
                            description: l.description,
                            debit: l.credit,
                            credit: l.debit,
                            taxCodeId: l.taxCodeId,
                            taxAmount: l.taxAmount
                        }))
                    }
                }
            });
            await tx.voucher.update({
                where: { id: voucher.id },
                data: {
                    status: client_1.VoucherStatus.void,
                    voidedAt: new Date(),
                    voidedByUserId: user.sub
                }
            });
            return { voidedVoucherId: voucher.id, reversalVoucherId: reversal.id };
        });
    }
    async getById(user, voucherId) {
        const voucher = await this.prisma.voucher.findFirst({
            where: { id: voucherId, companyId: user.companyId },
            include: { lines: true }
        });
        if (!voucher)
            throw new common_1.NotFoundException("Voucher not found");
        return voucher;
    }
};
exports.VouchersService = VouchersService;
exports.VouchersService = VouchersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VouchersService);
//# sourceMappingURL=vouchers.service.js.map