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
    async getCompanyOrThrow(companyId) {
        const company = await this.prisma.company.findUnique({ where: { id: companyId } });
        if (!company)
            throw new common_1.BadRequestException("Company not found");
        return company;
    }
    ensureVoucherDate(company, voucherDate) {
        if (company.lockDate && voucherDate <= company.lockDate) {
            throw new common_1.BadRequestException("Voucher date is locked");
        }
    }
    async validateReferences(companyId, input) {
        const partyIds = new Set();
        const accountIds = new Set();
        const itemIds = new Set();
        const taxCodeIds = new Set();
        if (input.partyId)
            partyIds.add(input.partyId);
        for (const line of input.lines || []) {
            accountIds.add(line.accountId);
            if (line.partyId)
                partyIds.add(line.partyId);
            if (line.itemId)
                itemIds.add(line.itemId);
            if (line.taxCodeId)
                taxCodeIds.add(line.taxCodeId);
        }
        const [accounts, parties, items, taxCodes] = await Promise.all([
            accountIds.size
                ? this.prisma.chartOfAccount.findMany({
                    where: { id: { in: Array.from(accountIds) }, companyId }
                })
                : Promise.resolve([]),
            partyIds.size
                ? this.prisma.party.findMany({ where: { id: { in: Array.from(partyIds) }, companyId } })
                : Promise.resolve([]),
            itemIds.size
                ? this.prisma.item.findMany({ where: { id: { in: Array.from(itemIds) }, companyId } })
                : Promise.resolve([]),
            taxCodeIds.size
                ? this.prisma.taxCode.findMany({ where: { id: { in: Array.from(taxCodeIds) }, companyId } })
                : Promise.resolve([])
        ]);
        if (accounts.length !== accountIds.size)
            throw new common_1.BadRequestException("Invalid account");
        if (parties.length !== partyIds.size)
            throw new common_1.BadRequestException("Invalid party");
        if (items.length !== itemIds.size)
            throw new common_1.BadRequestException("Invalid item");
        if (taxCodes.length !== taxCodeIds.size)
            throw new common_1.BadRequestException("Invalid tax code");
        if (accounts.some((a) => !a.isActive || !a.isPostable)) {
            throw new common_1.BadRequestException("Account not postable");
        }
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
        if (input.voucherType === client_1.VoucherType.reversal) {
            throw new common_1.BadRequestException("Reversal vouchers can only be created by void");
        }
        const company = await this.getCompanyOrThrow(user.companyId);
        this.ensureVoucherDate(company, input.voucherDate);
        await this.validateReferences(user.companyId, input);
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
        if (input.voucherType === client_1.VoucherType.reversal) {
            throw new common_1.BadRequestException("Reversal vouchers can only be created by void");
        }
        const data = {};
        if (input.voucherType)
            data.voucherType = input.voucherType;
        if (input.voucherDate)
            data.voucherDate = input.voucherDate;
        if (input.partyId !== undefined) {
            data.party = input.partyId ? { connect: { id: input.partyId } } : { disconnect: true };
        }
        if (input.memo !== undefined)
            data.memo = input.memo;
        return this.prisma.$transaction(async (tx) => {
            const company = await this.getCompanyOrThrow(user.companyId);
            if (input.voucherDate)
                this.ensureVoucherDate(company, input.voucherDate);
            if (input.lines || input.partyId)
                await this.validateReferences(user.companyId, input);
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
            this.ensureVoucherDate(company, voucher.voucherDate);
            await this.validateReferences(user.companyId, {
                partyId: voucher.partyId || undefined,
                lines: voucher.lines.map((l) => ({
                    accountId: l.accountId,
                    partyId: l.partyId || undefined,
                    itemId: l.itemId || undefined,
                    taxCodeId: l.taxCodeId || undefined
                }))
            });
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
    async list(user, filters) {
        const where = { companyId: user.companyId };
        if (filters.status)
            where.status = filters.status;
        if (filters.voucherType)
            where.voucherType = filters.voucherType;
        if (filters.partyId)
            where.partyId = filters.partyId;
        if (filters.from || filters.to) {
            where.voucherDate = {};
            if (filters.from)
                where.voucherDate.gte = filters.from;
            if (filters.to)
                where.voucherDate.lte = filters.to;
        }
        return this.prisma.voucher.findMany({
            where,
            orderBy: [{ voucherDate: "desc" }, { createdAt: "desc" }],
            skip: filters.skip || 0,
            take: filters.take || 50,
            select: {
                id: true,
                voucherNumber: true,
                voucherDate: true,
                voucherType: true,
                status: true,
                partyId: true,
                memo: true,
                createdAt: true,
                postedAt: true
            }
        });
    }
};
exports.VouchersService = VouchersService;
exports.VouchersService = VouchersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VouchersService);
//# sourceMappingURL=vouchers.service.js.map