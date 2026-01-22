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
exports.InvoicesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const nepali_date_1 = require("../../common/date/nepali-date");
let InvoicesService = class InvoicesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getCompany(companyId) {
        const company = await this.prisma.company.findUnique({ where: { id: companyId } });
        if (!company)
            throw new common_1.BadRequestException("Company not found");
        return company;
    }
    async validateItems(companyId, items) {
        const itemIds = Array.from(new Set(items.map((i) => i.itemId).filter(Boolean)));
        const taxCodeIds = Array.from(new Set(items.map((i) => i.taxCodeId).filter(Boolean)));
        if (itemIds.length) {
            const dbItems = await this.prisma.item.findMany({ where: { id: { in: itemIds }, companyId } });
            if (dbItems.length !== itemIds.length)
                throw new common_1.BadRequestException("Invalid item");
        }
        if (taxCodeIds.length) {
            const dbTax = await this.prisma.taxCode.findMany({ where: { id: { in: taxCodeIds }, companyId } });
            if (dbTax.length !== taxCodeIds.length)
                throw new common_1.BadRequestException("Invalid tax code");
        }
    }
    computeTotals(items) {
        let subtotal = new client_1.Prisma.Decimal(0);
        let vatAmount = new client_1.Prisma.Decimal(0);
        for (const item of items) {
            const lineAmount = new client_1.Prisma.Decimal(item.qty).mul(item.rate);
            subtotal = subtotal.add(lineAmount);
            if (item.taxAmount)
                vatAmount = vatAmount.add(item.taxAmount);
        }
        const total = subtotal.add(vatAmount);
        return { subtotal, vatAmount, total };
    }
    async preview(user, input) {
        await this.validateItems(user.companyId, input.items);
        const party = await this.prisma.party.findFirst({
            where: { id: input.partyId, companyId: user.companyId }
        });
        if (!party)
            throw new common_1.BadRequestException("Party not found");
        const resolvedDate = (0, nepali_date_1.resolveAdDate)(input.date, input.dateBs);
        const resolvedDue = input.dueDate || input.dueDateBs ? (0, nepali_date_1.resolveAdDate)(input.dueDate, input.dueDateBs) : null;
        const itemsWithTax = await Promise.all(input.items.map(async (item) => {
            let taxAmount = new client_1.Prisma.Decimal(0);
            if (item.taxCodeId) {
                const tax = await this.prisma.taxCode.findUnique({ where: { id: item.taxCodeId } });
                if (!tax)
                    throw new common_1.BadRequestException("Invalid tax code");
                const amount = new client_1.Prisma.Decimal(item.qty).mul(item.rate);
                taxAmount = amount.mul(tax.rate).div(100);
            }
            return {
                ...item,
                amount: new client_1.Prisma.Decimal(item.qty).mul(item.rate),
                taxAmount
            };
        }));
        const totals = this.computeTotals(itemsWithTax);
        const voucherLines = [];
        const receivable = await this.prisma.chartOfAccount.findFirst({
            where: { id: input.receivableAccountId, companyId: user.companyId }
        });
        if (!receivable)
            throw new common_1.BadRequestException("Receivable account not found");
        if (receivable.type !== "asset") {
            throw new common_1.BadRequestException("Receivable account must be an asset");
        }
        const itemMap = new Map();
        if (itemsWithTax.some((i) => i.itemId)) {
            const itemIds = itemsWithTax.map((i) => i.itemId).filter(Boolean);
            const dbItems = await this.prisma.item.findMany({ where: { id: { in: itemIds }, companyId: user.companyId } });
            for (const dbItem of dbItems) {
                if (!dbItem.incomeAccountId)
                    throw new common_1.BadRequestException("Item missing income account");
                itemMap.set(dbItem.id, dbItem.incomeAccountId);
            }
        }
        for (const item of itemsWithTax) {
            const accountId = item.itemId ? itemMap.get(item.itemId) : undefined;
            if (!accountId)
                throw new common_1.BadRequestException("Item missing income account");
            if (input.type === "sales") {
                voucherLines.push({
                    accountId,
                    debit: new client_1.Prisma.Decimal(0),
                    credit: item.amount,
                    description: item.description,
                    taxCodeId: item.taxCodeId,
                    taxAmount: item.taxAmount
                });
            }
            else {
                voucherLines.push({
                    accountId,
                    debit: item.amount,
                    credit: new client_1.Prisma.Decimal(0),
                    description: item.description,
                    taxCodeId: item.taxCodeId,
                    taxAmount: item.taxAmount
                });
            }
        }
        const taxGroups = new Map();
        for (const item of itemsWithTax) {
            if (!item.taxCodeId || item.taxAmount.lte(0))
                continue;
            taxGroups.set(item.taxCodeId, (taxGroups.get(item.taxCodeId) || new client_1.Prisma.Decimal(0)).add(item.taxAmount));
        }
        if (taxGroups.size) {
            const taxCodes = await this.prisma.taxCode.findMany({
                where: { id: { in: Array.from(taxGroups.keys()) }, companyId: user.companyId }
            });
            for (const taxCode of taxCodes) {
                if (!taxCode.outputTaxAccountId)
                    throw new common_1.BadRequestException("Tax code missing output account");
                const amount = taxGroups.get(taxCode.id) || new client_1.Prisma.Decimal(0);
                if (input.type === "sales") {
                    voucherLines.push({
                        accountId: taxCode.outputTaxAccountId,
                        debit: new client_1.Prisma.Decimal(0),
                        credit: amount,
                        description: "Output VAT",
                        taxCodeId: taxCode.id,
                        taxAmount: amount
                    });
                }
                else {
                    voucherLines.push({
                        accountId: taxCode.outputTaxAccountId,
                        debit: amount,
                        credit: new client_1.Prisma.Decimal(0),
                        description: "Output VAT",
                        taxCodeId: taxCode.id,
                        taxAmount: amount
                    });
                }
            }
        }
        if (input.type === "sales") {
            voucherLines.push({
                accountId: receivable.id,
                debit: totals.total,
                credit: new client_1.Prisma.Decimal(0),
                description: "Accounts Receivable"
            });
        }
        else {
            voucherLines.push({
                accountId: receivable.id,
                debit: new client_1.Prisma.Decimal(0),
                credit: totals.total,
                description: "Accounts Receivable"
            });
        }
        return {
            totals,
            voucherType: input.type === "sales" ? client_1.VoucherType.sales_invoice : client_1.VoucherType.sales_return,
            voucherLines,
            receivableAccountId: receivable.id,
            items: itemsWithTax,
            date: resolvedDate.date,
            dateBs: resolvedDate.bs || input.dateBs,
            dueDate: resolvedDue?.date,
            dueDateBs: resolvedDue?.bs || input.dueDateBs
        };
    }
    async createDraft(user, input) {
        const preview = await this.preview(user, input);
        const totals = preview.totals;
        return this.prisma.invoice.create({
            data: {
                companyId: user.companyId,
                type: input.type,
                partyId: input.partyId,
                date: preview.date,
                dateBs: preview.dateBs || null,
                dueDate: preview.dueDate,
                dueDateBs: preview.dueDateBs || null,
                receivableAccountId: input.receivableAccountId,
                subtotal: totals.subtotal,
                vatAmount: totals.vatAmount,
                total: totals.total,
                status: "draft",
                items: {
                    create: preview.items.map((item) => ({
                        itemId: item.itemId,
                        description: item.description,
                        qty: new client_1.Prisma.Decimal(item.qty),
                        rate: new client_1.Prisma.Decimal(item.rate),
                        amount: item.amount,
                        taxCodeId: item.taxCodeId,
                        taxAmount: item.taxAmount
                    }))
                }
            },
            include: { items: true }
        });
    }
    async post(user, invoiceId) {
        const invoice = await this.prisma.invoice.findFirst({
            where: { id: invoiceId, companyId: user.companyId },
            include: { items: true }
        });
        if (!invoice)
            throw new common_1.NotFoundException("Invoice not found");
        if (invoice.status !== "draft")
            throw new common_1.ForbiddenException("Only draft invoices can be posted");
        const company = await this.getCompany(user.companyId);
        if (company.lockDate && invoice.date <= company.lockDate) {
            throw new common_1.BadRequestException("Invoice date is locked");
        }
        const preview = await this.preview(user, {
            type: invoice.type,
            partyId: invoice.partyId,
            date: invoice.date,
            dueDate: invoice.dueDate || undefined,
            receivableAccountId: invoice.receivableAccountId,
            items: invoice.items.map((i) => ({
                itemId: i.itemId || undefined,
                description: i.description || undefined,
                qty: i.qty.toNumber(),
                rate: i.rate.toNumber(),
                taxCodeId: i.taxCodeId || undefined
            }))
        });
        const voucherType = invoice.type === "sales" ? client_1.VoucherType.sales_invoice : client_1.VoucherType.sales_return;
        const sequence = company.nextInvoiceNumber;
        const voucherNumber = `${company.invoicePrefix}-${sequence}`;
        return this.prisma.$transaction(async (tx) => {
            const voucher = await tx.voucher.create({
                data: {
                    companyId: user.companyId,
                    voucherType,
                    status: client_1.VoucherStatus.posted,
                    voucherDate: invoice.date,
                    partyId: invoice.partyId,
                    memo: `Invoice ${invoice.id}`,
                    postedAt: new Date(),
                    postedByUserId: user.sub,
                    voucherNumber,
                    lines: {
                        create: preview.voucherLines.map((l, idx) => ({
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
            await tx.company.update({
                where: { id: company.id },
                data: { nextInvoiceNumber: sequence + 1 }
            });
            return tx.invoice.update({
                where: { id: invoice.id },
                data: {
                    status: "posted",
                    voucherId: voucher.id,
                    invoiceNo: voucherNumber
                }
            });
        });
    }
    async void(user, invoiceId) {
        const invoice = await this.prisma.invoice.findFirst({
            where: { id: invoiceId, companyId: user.companyId }
        });
        if (!invoice)
            throw new common_1.NotFoundException("Invoice not found");
        if (invoice.status !== "posted" || !invoice.voucherId) {
            throw new common_1.ForbiddenException("Only posted invoices can be voided");
        }
        await this.prisma.voucher.update({
            where: { id: invoice.voucherId },
            data: { status: client_1.VoucherStatus.void, voidedAt: new Date(), voidedByUserId: user.sub }
        });
        return this.prisma.invoice.update({
            where: { id: invoice.id },
            data: { status: "void" }
        });
    }
    async list(user, filters) {
        const where = { companyId: user.companyId };
        if (filters.type)
            where.type = filters.type;
        if (filters.status)
            where.status = filters.status;
        if (filters.from || filters.to) {
            where.date = {};
            if (filters.from)
                where.date.gte = filters.from;
            if (filters.to)
                where.date.lte = filters.to;
        }
        return this.prisma.invoice.findMany({
            where,
            orderBy: { date: "desc" },
            skip: filters.skip || 0,
            take: filters.take || 50
        });
    }
    async getById(user, invoiceId) {
        const invoice = await this.prisma.invoice.findFirst({
            where: { id: invoiceId, companyId: user.companyId },
            include: { items: true }
        });
        if (!invoice)
            throw new common_1.NotFoundException("Invoice not found");
        return invoice;
    }
};
exports.InvoicesService = InvoicesService;
exports.InvoicesService = InvoicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InvoicesService);
//# sourceMappingURL=invoices.service.js.map