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
exports.ExpensesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const nepali_date_1 = require("../../common/date/nepali-date");
let ExpensesService = class ExpensesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async validateRefs(user, input) {
        if (input.vendorId) {
            const vendor = await this.prisma.party.findFirst({
                where: { id: input.vendorId, companyId: user.companyId }
            });
            if (!vendor)
                throw new common_1.BadRequestException("Vendor not found");
        }
        if (input.taxCodeId) {
            const tax = await this.prisma.taxCode.findFirst({
                where: { id: input.taxCodeId, companyId: user.companyId }
            });
            if (!tax)
                throw new common_1.BadRequestException("Tax code not found");
        }
        if (input.attachmentId) {
            const attachment = await this.prisma.voucherAttachment.findFirst({
                where: { id: input.attachmentId, companyId: user.companyId }
            });
            if (!attachment)
                throw new common_1.BadRequestException("Attachment not found");
        }
    }
    async buildVoucherLines(user, input) {
        const expenseAccount = await this.prisma.chartOfAccount.findFirst({
            where: { id: input.expenseAccountId, companyId: user.companyId }
        });
        const paymentAccount = await this.prisma.chartOfAccount.findFirst({
            where: { id: input.paymentAccountId, companyId: user.companyId }
        });
        if (!expenseAccount || !paymentAccount)
            throw new common_1.BadRequestException("Account not found");
        const amount = new client_1.Prisma.Decimal(input.amount);
        let taxAmount = new client_1.Prisma.Decimal(0);
        let taxAccountId = null;
        if (input.taxCodeId) {
            const tax = await this.prisma.taxCode.findFirst({
                where: { id: input.taxCodeId, companyId: user.companyId }
            });
            if (!tax?.inputTaxAccountId)
                throw new common_1.BadRequestException("Tax code missing input account");
            taxAmount = amount.mul(tax.rate).div(100);
            taxAccountId = tax.inputTaxAccountId;
        }
        const total = amount.add(taxAmount);
        const lines = [
            {
                accountId: expenseAccount.id,
                debit: amount,
                credit: new client_1.Prisma.Decimal(0),
                description: "Expense"
            },
            ...(taxAccountId
                ? [
                    {
                        accountId: taxAccountId,
                        debit: taxAmount,
                        credit: new client_1.Prisma.Decimal(0),
                        description: "Input VAT",
                        taxCodeId: input.taxCodeId,
                        taxAmount
                    }
                ]
                : []),
            {
                accountId: paymentAccount.id,
                debit: new client_1.Prisma.Decimal(0),
                credit: total,
                description: "Payment"
            }
        ];
        return { lines, total, taxAmount };
    }
    async createDraft(user, input) {
        await this.validateRefs(user, input);
        const { lines, total, taxAmount } = await this.buildVoucherLines(user, input);
        const resolved = (0, nepali_date_1.resolveAdDate)(input.date, input.dateBs);
        return this.prisma.expense.create({
            data: {
                companyId: user.companyId,
                date: resolved.date,
                dateBs: resolved.bs || null,
                vendorId: input.vendorId,
                amount: total,
                taxCodeId: input.taxCodeId,
                description: input.description,
                attachmentId: input.attachmentId,
                status: "draft"
            }
        });
    }
    async preview(user, input) {
        await this.validateRefs(user, input);
        const { lines, total, taxAmount } = await this.buildVoucherLines(user, input);
        return { total, taxAmount, lines };
    }
    async post(user, expenseId, input) {
        const expense = await this.prisma.expense.findFirst({
            where: { id: expenseId, companyId: user.companyId }
        });
        if (!expense)
            throw new common_1.NotFoundException("Expense not found");
        if (expense.status !== "draft")
            throw new common_1.ForbiddenException("Only draft expenses can be posted");
        const preview = await this.preview(user, input);
        const voucher = await this.prisma.voucher.create({
            data: {
                companyId: user.companyId,
                voucherType: client_1.VoucherType.payment,
                status: client_1.VoucherStatus.posted,
                voucherDate: expense.date,
                partyId: expense.vendorId,
                memo: expense.description || "Expense",
                postedAt: new Date(),
                postedByUserId: user.sub,
                lines: {
                    create: preview.lines.map((l, idx) => ({
                        companyId: user.companyId,
                        lineNo: idx + 1,
                        accountId: l.accountId,
                        description: l.description,
                        debit: l.debit,
                        credit: l.credit,
                        taxCodeId: l.taxCodeId,
                        taxAmount: l.taxAmount || new client_1.Prisma.Decimal(0)
                    }))
                }
            }
        });
        return this.prisma.expense.update({
            where: { id: expense.id },
            data: { status: "posted", voucherId: voucher.id }
        });
    }
    async list(user, filters) {
        const where = { companyId: user.companyId };
        if (filters.status)
            where.status = filters.status;
        if (filters.from || filters.to) {
            where.date = {};
            if (filters.from)
                where.date.gte = filters.from;
            if (filters.to)
                where.date.lte = filters.to;
        }
        return this.prisma.expense.findMany({
            where,
            orderBy: { date: "desc" },
            skip: filters.skip || 0,
            take: filters.take || 50
        });
    }
};
exports.ExpensesService = ExpensesService;
exports.ExpensesService = ExpensesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExpensesService);
//# sourceMappingURL=expenses.service.js.map