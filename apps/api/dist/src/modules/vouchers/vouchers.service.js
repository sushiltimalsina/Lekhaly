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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VouchersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const crypto_1 = __importDefault(require("crypto"));
const nepali_date_1 = require("../../common/date/nepali-date");
let VouchersService = class VouchersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    enforceVoucherRules(voucherType, partyId) {
        const requiresParty = [
            client_1.VoucherType.sales_invoice,
            client_1.VoucherType.sales_return,
            client_1.VoucherType.purchase,
            client_1.VoucherType.purchase_return
        ];
        const forbidsParty = [
            client_1.VoucherType.journal,
            client_1.VoucherType.opening,
            client_1.VoucherType.reversal
        ];
        if (requiresParty.includes(voucherType) && !partyId) {
            throw new common_1.BadRequestException("Party is required for this voucher type");
        }
        if (forbidsParty.includes(voucherType) && partyId) {
            throw new common_1.BadRequestException("Party is not allowed for this voucher type");
        }
    }
    toJsonSafe(value) {
        return JSON.parse(JSON.stringify(value));
    }
    async idempotencyGuard(user, action, idempotencyKey, payload) {
        if (!idempotencyKey)
            return null;
        const requestHash = payload
            ? crypto_1.default.createHash("sha256").update(JSON.stringify(payload)).digest("hex")
            : null;
        const existing = await this.prisma.apiIdempotency.findUnique({
            where: {
                companyId_key_action: {
                    companyId: user.companyId,
                    key: idempotencyKey,
                    action
                }
            }
        });
        if (existing) {
            if (requestHash && existing.requestHash && existing.requestHash !== requestHash) {
                throw new common_1.ConflictException("Idempotency key reused with different payload");
            }
            return { kind: "existing", response: existing.responseJson };
        }
        return { kind: "new", requestHash };
    }
    async storeIdempotency(user, action, idempotencyKey, requestHash, responseJson) {
        await this.prisma.apiIdempotency.create({
            data: {
                companyId: user.companyId,
                userId: user.sub,
                key: idempotencyKey,
                action,
                requestHash,
                responseJson
            }
        });
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
    async validateReferences(companyId, input, voucherType) {
        const partyIds = new Set();
        const accountIds = new Set();
        const itemIds = new Set();
        const taxCodeIds = new Set();
        if (input.partyId)
            partyIds.add(input.partyId);
        for (const line of input.lines || []) {
            if (line.accountId)
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
        if (voucherType && itemIds.size) {
            const itemMap = new Map(items.map((i) => [i.id, i]));
            for (const line of input.lines || []) {
                if (!line.itemId)
                    continue;
                const item = itemMap.get(line.itemId);
                if (!item)
                    throw new common_1.BadRequestException("Invalid item");
                if (voucherType === client_1.VoucherType.sales_invoice ||
                    voucherType === client_1.VoucherType.sales_return ||
                    voucherType === client_1.VoucherType.receipt) {
                    if (!item.incomeAccountId)
                        throw new common_1.BadRequestException("Item missing income account");
                    if (item.incomeAccountId !== line.accountId) {
                        throw new common_1.BadRequestException("Item income account mismatch");
                    }
                }
                if (voucherType === client_1.VoucherType.payment || voucherType === client_1.VoucherType.purchase || voucherType === client_1.VoucherType.purchase_return) {
                    if (!item.expenseAccountId)
                        throw new common_1.BadRequestException("Item missing expense account");
                    if (item.expenseAccountId !== line.accountId) {
                        throw new common_1.BadRequestException("Item expense account mismatch");
                    }
                }
            }
        }
    }
    async buildTaxLines(companyId, voucherType, lines) {
        const taxCodeIds = Array.from(new Set(lines.map((l) => l.taxCodeId).filter(Boolean)));
        if (taxCodeIds.length === 0)
            return [];
        if (voucherType === client_1.VoucherType.journal ||
            voucherType === client_1.VoucherType.opening ||
            voucherType === client_1.VoucherType.reversal) {
            throw new common_1.BadRequestException("Tax codes are not allowed for this voucher type");
        }
        const taxCodes = await this.prisma.taxCode.findMany({
            where: { id: { in: taxCodeIds }, companyId }
        });
        const taxMap = new Map(taxCodes.map((t) => [t.id, t]));
        const accountIds = new Set();
        const result = [];
        let nextLineNo = Math.max(...lines.map((l) => l.lineNo), 0) + 1;
        for (const line of lines) {
            if (!line.taxCodeId)
                continue;
            const taxCode = taxMap.get(line.taxCodeId);
            if (!taxCode)
                throw new common_1.BadRequestException("Invalid tax code");
            const taxAmount = line.taxAmount ? new client_1.Prisma.Decimal(line.taxAmount) : new client_1.Prisma.Decimal(0);
            if (taxAmount.lte(0))
                throw new common_1.BadRequestException("Tax amount must be greater than zero");
            if (voucherType === client_1.VoucherType.sales_invoice ||
                voucherType === client_1.VoucherType.receipt ||
                voucherType === client_1.VoucherType.purchase_return) {
                if (line.credit.lte(0)) {
                    throw new common_1.BadRequestException("Tax on sales must be on credit lines");
                }
                if (!taxCode.outputTaxAccountId)
                    throw new common_1.BadRequestException("Tax code missing output account");
                accountIds.add(taxCode.outputTaxAccountId);
                result.push({
                    lineNo: nextLineNo++,
                    accountId: taxCode.outputTaxAccountId,
                    description: "Tax",
                    debit: new client_1.Prisma.Decimal(0),
                    credit: taxAmount,
                    taxCodeId: taxCode.id,
                    taxAmount
                });
            }
            if (voucherType === client_1.VoucherType.payment || voucherType === client_1.VoucherType.purchase || voucherType === client_1.VoucherType.sales_return) {
                if (line.debit.lte(0)) {
                    throw new common_1.BadRequestException("Tax on purchases must be on debit lines");
                }
                if (!taxCode.inputTaxAccountId)
                    throw new common_1.BadRequestException("Tax code missing input account");
                accountIds.add(taxCode.inputTaxAccountId);
                result.push({
                    lineNo: nextLineNo++,
                    accountId: taxCode.inputTaxAccountId,
                    description: "Tax",
                    debit: taxAmount,
                    credit: new client_1.Prisma.Decimal(0),
                    taxCodeId: taxCode.id,
                    taxAmount
                });
            }
        }
        if (accountIds.size) {
            const accounts = await this.prisma.chartOfAccount.findMany({
                where: { id: { in: Array.from(accountIds) }, companyId }
            });
            if (accounts.length !== accountIds.size)
                throw new common_1.BadRequestException("Invalid tax account");
            if (accounts.some((a) => !a.isActive || !a.isPostable)) {
                throw new common_1.BadRequestException("Tax account not postable");
            }
        }
        return result;
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
                accountId: (() => {
                    if (!line.accountId)
                        throw new common_1.BadRequestException("Line missing accountId");
                    return line.accountId;
                })(),
                partyId: line.partyId,
                itemId: line.itemId,
                description: line.description,
                debit: new client_1.Prisma.Decimal(debit),
                credit: new client_1.Prisma.Decimal(credit),
                qty: new client_1.Prisma.Decimal(Number(line.qty || 0)),
                taxCodeId: line.taxCodeId || null,
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
    async createDraft(user, input, idempotencyKey) {
        if (!input.voucherType || (!input.voucherDate && !input.voucherDateBs) || !input.lines) {
            throw new common_1.BadRequestException("Missing draft fields");
        }
        if (input.voucherType === client_1.VoucherType.reversal) {
            throw new common_1.BadRequestException("Reversal vouchers can only be created by void");
        }
        this.enforceVoucherRules(input.voucherType, input.partyId);
        const guard = await this.idempotencyGuard(user, "voucher.createDraft", idempotencyKey, input);
        if (guard?.kind === "existing") {
            return guard.response;
        }
        const company = await this.getCompanyOrThrow(user.companyId);
        const resolved = (0, nepali_date_1.resolveAdDate)(input.voucherDate, input.voucherDateBs);
        this.ensureVoucherDate(company, resolved.date);
        await this.validateReferences(user.companyId, input, input.voucherType);
        const lines = this.normalizeLines(input.lines);
        const voucher = await this.prisma.voucher.create({
            data: {
                companyId: user.companyId,
                voucherType: input.voucherType,
                status: client_1.VoucherStatus.draft,
                voucherDate: resolved.date,
                voucherDateBs: resolved.bs || null,
                partyId: input.partyId,
                referenceNo: input.referenceNo,
                vendorInvoiceNo: input.vendorInvoiceNo,
                vendorInvoiceDate: input.vendorInvoiceDate,
                memo: input.memo,
                additionalNote: input.additionalNote,
                createdByUserId: user.sub,
                lines: {
                    create: lines.map((l) => ({ ...l, accountId: l.accountId, companyId: user.companyId }))
                }
            },
            include: { lines: true }
        });
        if (idempotencyKey && guard?.kind === "new") {
            await this.storeIdempotency(user, "voucher.createDraft", idempotencyKey, guard.requestHash, this.toJsonSafe(voucher));
        }
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
        const nextType = input.voucherType ?? voucher.voucherType;
        const nextParty = input.partyId !== undefined ? input.partyId : voucher.partyId ? voucher.partyId : undefined;
        this.enforceVoucherRules(nextType, nextParty);
        const data = {};
        if (input.voucherType)
            data.voucherType = input.voucherType;
        if (input.partyId !== undefined) {
            data.party = input.partyId ? { connect: { id: input.partyId } } : { disconnect: true };
        }
        if (input.referenceNo !== undefined)
            data.referenceNo = input.referenceNo;
        if (input.vendorInvoiceNo !== undefined)
            data.vendorInvoiceNo = input.vendorInvoiceNo;
        if (input.vendorInvoiceDate !== undefined)
            data.vendorInvoiceDate = input.vendorInvoiceDate;
        if (input.memo !== undefined)
            data.memo = input.memo;
        if (input.additionalNote !== undefined)
            data.additionalNote = input.additionalNote;
        return this.prisma.$transaction(async (tx) => {
            const company = await this.getCompanyOrThrow(user.companyId);
            if (input.voucherDate || input.voucherDateBs) {
                const resolved = (0, nepali_date_1.resolveAdDate)(input.voucherDate, input.voucherDateBs);
                data.voucherDate = resolved.date;
                data.voucherDateBs = resolved.bs || null;
                this.ensureVoucherDate(company, resolved.date);
            }
            if (input.lines || input.partyId)
                await this.validateReferences(user.companyId, input, nextType);
            if (input.lines) {
                const lines = this.normalizeLines(input.lines);
                await tx.voucherLine.deleteMany({ where: { voucherId: voucher.id } });
                await tx.voucherLine.createMany({
                    data: lines.map((l) => ({ ...l, accountId: l.accountId, voucherId: voucher.id, companyId: user.companyId }))
                });
            }
            const updated = await tx.voucher.update({
                where: { id: voucher.id },
                data: data
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
        const normalized = voucher.lines.map((l) => ({
            lineNo: l.lineNo,
            accountId: l.accountId,
            debit: l.debit,
            credit: l.credit,
            taxCodeId: l.taxCodeId || undefined,
            taxAmount: l.taxAmount
        }));
        const taxLines = await this.buildTaxLines(user.companyId, voucher.voucherType, normalized);
        const totals = this.computeTotals([...normalized, ...taxLines].map((l) => ({ debit: l.debit, credit: l.credit })));
        const balanced = totals.debit.equals(totals.credit);
        return {
            voucherId: voucher.id,
            status: voucher.status,
            totalDebit: totals.debit,
            totalCredit: totals.credit,
            balanced
        };
    }
    async post(user, voucherId, idempotencyKey) {
        const guard = await this.idempotencyGuard(user, "voucher.post", idempotencyKey, { voucherId });
        if (guard?.kind === "existing") {
            return guard.response;
        }
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
            this.enforceVoucherRules(voucher.voucherType, voucher.partyId);
            const normalized = voucher.lines.map((l) => ({
                lineNo: l.lineNo,
                accountId: l.accountId,
                debit: l.debit,
                credit: l.credit,
                qty: l.qty,
                taxCodeId: l.taxCodeId || undefined,
                taxAmount: l.taxAmount
            }));
            const taxLines = await this.buildTaxLines(user.companyId, voucher.voucherType, normalized);
            const totals = this.computeTotals([...normalized, ...taxLines].map((l) => ({ debit: l.debit, credit: l.credit })));
            if (!totals.debit.equals(totals.credit))
                throw new common_1.BadRequestException("Voucher not balanced");
            const company = await tx.company.findUnique({
                where: { id: user.companyId },
                include: { fiscalSessions: { where: { id: (await tx.company.findFirst({ where: { id: user.companyId } }))?.activeFiscalSessionId || undefined } } }
            });
            if (!company)
                throw new common_1.BadRequestException("Company not found");
            const activeSession = company.fiscalSessions[0];
            if (!activeSession) {
                throw new common_1.BadRequestException("No active fiscal session found. Please create and activate a fiscal session first.");
            }
            if (activeSession.isLocked) {
                throw new common_1.BadRequestException("The active fiscal session is locked.");
            }
            if (voucher.voucherDate < activeSession.startDate || voucher.voucherDate > activeSession.endDate) {
                throw new common_1.BadRequestException(`Voucher date (${voucher.voucherDate.toISOString().split("T")[0]}) is outside the active fiscal session range (${activeSession.startDate.toISOString().split("T")[0]} to ${activeSession.endDate.toISOString().split("T")[0]}).`);
            }
            this.ensureVoucherDate(company, voucher.voucherDate);
            await this.validateReferences(user.companyId, {
                partyId: voucher.partyId || undefined,
                lines: voucher.lines.map((l) => ({
                    accountId: l.accountId,
                    partyId: l.partyId || undefined,
                    itemId: l.itemId || undefined,
                    taxCodeId: l.taxCodeId || undefined
                }))
            }, voucher.voucherType);
            let sequence;
            let prefix;
            let suffix;
            const seqUpdate = {};
            switch (voucher.voucherType) {
                case client_1.VoucherType.sales_invoice:
                    sequence = activeSession.nextInvoiceNumber;
                    prefix = activeSession.invoicePrefix;
                    suffix = activeSession.invoiceSuffix || "";
                    seqUpdate.nextInvoiceNumber = sequence + 1;
                    break;
                case client_1.VoucherType.purchase:
                    sequence = activeSession.nextPurchaseNumber;
                    prefix = activeSession.purchasePrefix;
                    suffix = activeSession.purchaseSuffix || "";
                    seqUpdate.nextPurchaseNumber = sequence + 1;
                    break;
                case client_1.VoucherType.sales_return:
                    sequence = activeSession.nextSalesReturnNumber;
                    prefix = activeSession.salesReturnPrefix;
                    suffix = activeSession.salesReturnSuffix || "";
                    seqUpdate.nextSalesReturnNumber = sequence + 1;
                    break;
                case client_1.VoucherType.purchase_return:
                    sequence = activeSession.nextPurchaseReturnNumber;
                    prefix = activeSession.purchaseReturnPrefix;
                    suffix = activeSession.purchaseReturnSuffix || "";
                    seqUpdate.nextPurchaseReturnNumber = sequence + 1;
                    break;
                case client_1.VoucherType.receipt:
                    sequence = activeSession.nextReceiptNumber;
                    prefix = activeSession.receiptPrefix;
                    suffix = activeSession.receiptSuffix || "";
                    seqUpdate.nextReceiptNumber = sequence + 1;
                    break;
                case client_1.VoucherType.payment:
                    sequence = activeSession.nextPaymentNumber;
                    prefix = activeSession.paymentPrefix;
                    suffix = activeSession.paymentSuffix || "";
                    seqUpdate.nextPaymentNumber = sequence + 1;
                    break;
                case client_1.VoucherType.journal:
                case client_1.VoucherType.opening:
                case client_1.VoucherType.reversal:
                default:
                    sequence = activeSession.nextJournalNumber;
                    prefix = activeSession.journalPrefix;
                    suffix = activeSession.journalSuffix || "";
                    seqUpdate.nextJournalNumber = sequence + 1;
                    break;
            }
            const p = prefix || "";
            const s = suffix || "";
            const formattedPrefix = p ? (p.endsWith("-") ? p : `${p}-`) : "";
            const formattedSuffix = s ? (s.startsWith("-") ? s : `-${s}`) : "";
            const voucherNumber = `${formattedPrefix}${sequence}${formattedSuffix}`;
            const posted = await tx.voucher.update({
                where: { id: voucher.id },
                data: {
                    status: client_1.VoucherStatus.posted,
                    postedAt: new Date(),
                    postedByUserId: user.sub,
                    voucherNumber,
                    fiscalSessionId: activeSession.id
                }
            });
            await tx.fiscalSession.update({
                where: { id: activeSession.id },
                data: seqUpdate
            });
            if (taxLines.length) {
                await tx.voucherLine.createMany({
                    data: taxLines.map((l) => ({
                        voucherId: voucher.id,
                        companyId: user.companyId,
                        lineNo: l.lineNo,
                        accountId: l.accountId,
                        description: l.description,
                        debit: l.debit,
                        credit: l.credit,
                        qty: l.qty || new client_1.Prisma.Decimal(0),
                        taxCodeId: l.taxCodeId,
                        taxAmount: l.taxAmount
                    }))
                });
            }
            const itemLines = voucher.lines.filter(l => l.itemId);
            if (itemLines.length > 0) {
                const stockEntries = itemLines.map(line => {
                    const l = line;
                    const isPurchase = voucher.voucherType === client_1.VoucherType.purchase || voucher.voucherType === client_1.VoucherType.purchase_return;
                    const isSale = voucher.voucherType === client_1.VoucherType.sales_invoice || voucher.voucherType === client_1.VoucherType.sales_return;
                    let qtyIn = new client_1.Prisma.Decimal(0);
                    let qtyOut = new client_1.Prisma.Decimal(0);
                    let amount = new client_1.Prisma.Decimal(0);
                    let rate = new client_1.Prisma.Decimal(0);
                    const quantity = (l.qty && l.qty.equals(0) === false) ? l.qty : new client_1.Prisma.Decimal(1);
                    if (isPurchase) {
                        amount = l.debit;
                        qtyIn = quantity;
                        rate = quantity.equals(0) ? new client_1.Prisma.Decimal(0) : l.debit.div(quantity);
                    }
                    else if (isSale) {
                        amount = l.credit;
                        qtyOut = quantity;
                        rate = quantity.equals(0) ? new client_1.Prisma.Decimal(0) : l.credit.div(quantity);
                    }
                    return {
                        companyId: user.companyId,
                        itemId: l.itemId,
                        date: voucher.voucherDate,
                        dateBs: voucher.voucherDateBs || undefined,
                        voucherId: voucher.id,
                        qtyIn,
                        qtyOut,
                        rate,
                        amount
                    };
                });
                await tx.stockLedger.createMany({
                    data: stockEntries
                });
            }
            const result = await tx.voucher.findUnique({ where: { id: posted.id }, include: { lines: true } });
            if (idempotencyKey && guard?.kind === "new" && result) {
                await tx.apiIdempotency.create({
                    data: {
                        companyId: user.companyId,
                        userId: user.sub,
                        key: idempotencyKey,
                        action: "voucher.post",
                        requestHash: guard.requestHash,
                        responseJson: this.toJsonSafe(result)
                    }
                });
            }
            return result;
        });
    }
    async void(user, voucherId, idempotencyKey) {
        const guard = await this.idempotencyGuard(user, "voucher.void", idempotencyKey, { voucherId });
        if (guard?.kind === "existing") {
            return guard.response;
        }
        return this.prisma.$transaction(async (tx) => {
            const voucher = await tx.voucher.findFirst({
                where: { id: voucherId, companyId: user.companyId },
                include: { lines: true }
            });
            if (!voucher)
                throw new common_1.NotFoundException("Voucher not found");
            if (voucher.status !== client_1.VoucherStatus.posted)
                throw new common_1.ForbiddenException("Only posted vouchers can be voided");
            const company = await tx.company.findUnique({ where: { id: user.companyId } });
            if (!company)
                throw new common_1.BadRequestException("Company not found");
            this.ensureVoucherDate(company, voucher.voucherDate);
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
            const result = { voidedVoucherId: voucher.id, reversalVoucherId: reversal.id };
            if (idempotencyKey && guard?.kind === "new") {
                await tx.apiIdempotency.create({
                    data: {
                        companyId: user.companyId,
                        userId: user.sub,
                        key: idempotencyKey,
                        action: "voucher.void",
                        requestHash: guard.requestHash,
                        responseJson: this.toJsonSafe(result)
                    }
                });
            }
            return result;
        });
    }
    async getById(user, voucherId) {
        const voucher = await this.prisma.voucher.findFirst({
            where: { id: voucherId, companyId: user.companyId },
            include: {
                lines: true,
                party: {
                    select: { id: true, name: true }
                }
            }
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
        if (filters.createdByUserId)
            where.createdByUserId = filters.createdByUserId;
        if (filters.postedByUserId)
            where.postedByUserId = filters.postedByUserId;
        if (filters.voidedByUserId)
            where.voidedByUserId = filters.voidedByUserId;
        if (filters.voucherNumber)
            where.voucherNumber = filters.voucherNumber;
        if (filters.memo)
            where.memo = { contains: filters.memo, mode: "insensitive" };
        if (filters.from || filters.to) {
            where.voucherDate = {};
            if (filters.from)
                where.voucherDate.gte = filters.from;
            if (filters.to)
                where.voucherDate.lte = filters.to;
        }
        if (filters.q) {
            where.OR = [
                { voucherNumber: { contains: filters.q, mode: "insensitive" } },
                { memo: { contains: filters.q, mode: "insensitive" } },
                { additionalNote: { contains: filters.q, mode: "insensitive" } },
                { party: { name: { contains: filters.q, mode: "insensitive" } } }
            ];
        }
        const [total, data] = await this.prisma.$transaction([
            this.prisma.voucher.count({ where }),
            this.prisma.voucher.findMany({
                where,
                orderBy: [{ voucherDate: "desc" }, { createdAt: "desc" }],
                skip: filters.skip || 0,
                take: filters.take || 50,
                include: {
                    party: { select: { id: true, name: true, panNumber: true, vatNumber: true } },
                    lines: {
                        include: {
                            item: { select: { id: true, name: true, sku: true } },
                            account: { select: { id: true, name: true, code: true } },
                            party: { select: { id: true, name: true } }
                        }
                    },
                    stockLedger: {
                        select: {
                            id: true,
                            itemId: true,
                            qtyIn: true,
                            qtyOut: true,
                            rate: true
                        }
                    }
                }
            })
        ]);
        return {
            data,
            meta: {
                total,
                page: Math.floor((filters.skip || 0) / (filters.take || 50)) + 1,
                lastPage: Math.ceil(total / (filters.take || 50))
            }
        };
    }
    async listAttachments(user, voucherId) {
        const voucher = await this.prisma.voucher.findFirst({
            where: { id: voucherId, companyId: user.companyId }
        });
        if (!voucher)
            throw new common_1.NotFoundException("Voucher not found");
        return this.prisma.voucherAttachment.findMany({
            where: { voucherId: voucher.id, companyId: user.companyId },
            orderBy: { createdAt: "desc" },
            include: {
                uploadedByUser: { select: { id: true, email: true, name: true } }
            }
        });
    }
    async getAttachmentUrl(user, voucherId, attachmentId) {
        const voucher = await this.prisma.voucher.findFirst({
            where: { id: voucherId, companyId: user.companyId }
        });
        if (!voucher)
            throw new common_1.NotFoundException("Voucher not found");
        const attachment = await this.prisma.voucherAttachment.findFirst({
            where: { id: attachmentId, voucherId: voucher.id, companyId: user.companyId }
        });
        if (!attachment)
            throw new common_1.NotFoundException("Attachment not found");
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        const url = `https://files.local/${attachment.storageKey}?expires=${encodeURIComponent(expiresAt.toISOString())}`;
        return {
            attachmentId: attachment.id,
            fileName: attachment.fileName,
            mimeType: attachment.mimeType,
            url,
            expiresAt
        };
    }
    async addAttachment(user, voucherId, input) {
        const voucher = await this.prisma.voucher.findFirst({
            where: { id: voucherId, companyId: user.companyId }
        });
        if (!voucher)
            throw new common_1.NotFoundException("Voucher not found");
        if (voucher.status === client_1.VoucherStatus.void) {
            throw new common_1.ForbiddenException("Cannot attach to void vouchers");
        }
        return this.prisma.voucherAttachment.create({
            data: {
                companyId: user.companyId,
                voucherId: voucher.id,
                uploadedByUserId: user.sub,
                fileName: input.fileName,
                mimeType: input.mimeType,
                sizeBytes: input.sizeBytes,
                storageKey: input.storageKey
            }
        });
    }
    async removeAttachment(user, voucherId, attachmentId) {
        const voucher = await this.prisma.voucher.findFirst({
            where: { id: voucherId, companyId: user.companyId }
        });
        if (!voucher)
            throw new common_1.NotFoundException("Voucher not found");
        const attachment = await this.prisma.voucherAttachment.findFirst({
            where: { id: attachmentId, voucherId: voucher.id, companyId: user.companyId }
        });
        if (!attachment)
            throw new common_1.NotFoundException("Attachment not found");
        await this.prisma.voucherAttachment.delete({ where: { id: attachment.id } });
        return { id: attachment.id, deleted: true };
    }
};
exports.VouchersService = VouchersService;
exports.VouchersService = VouchersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VouchersService);
//# sourceMappingURL=vouchers.service.js.map