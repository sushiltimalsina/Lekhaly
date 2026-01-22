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
exports.BankingService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const nepali_date_1 = require("../../common/date/nepali-date");
let BankingService = class BankingService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async ensureBankAccount(user, accountId) {
        const account = await this.prisma.chartOfAccount.findFirst({
            where: { id: accountId, companyId: user.companyId }
        });
        if (!account)
            throw new common_1.BadRequestException("Account not found");
        if (account.type !== "asset") {
            throw new common_1.BadRequestException("Bank account must be an asset account");
        }
        return account;
    }
    async createBankAccount(user, input) {
        await this.ensureBankAccount(user, input.accountId);
        return this.prisma.bankAccount.create({
            data: {
                companyId: user.companyId,
                accountId: input.accountId,
                bankName: input.bankName,
                accountNumber: input.accountNumber
            }
        });
    }
    async listStatements(user, filters) {
        const where = { companyId: user.companyId };
        if (filters.bankAccountId)
            where.bankAccountId = filters.bankAccountId;
        if (filters.from || filters.to) {
            where.periodFrom = {};
            if (filters.from)
                where.periodFrom.gte = filters.from;
            if (filters.to)
                where.periodFrom.lte = filters.to;
        }
        return this.prisma.bankStatement.findMany({
            where,
            orderBy: { periodFrom: "desc" },
            skip: filters.skip || 0,
            take: filters.take || 50,
            include: { bankAccount: true }
        });
    }
    async getStatement(user, statementId) {
        const statement = await this.prisma.bankStatement.findFirst({
            where: { id: statementId, companyId: user.companyId },
            include: { bankAccount: true, lines: true }
        });
        if (!statement)
            throw new common_1.NotFoundException("Statement not found");
        return statement;
    }
    async createStatement(user, input) {
        const account = await this.prisma.bankAccount.findFirst({
            where: { id: input.bankAccountId, companyId: user.companyId }
        });
        if (!account)
            throw new common_1.BadRequestException("Bank account not found");
        const fromResolved = (0, nepali_date_1.resolveAdDate)(input.periodFrom, input.periodFromBs);
        const toResolved = (0, nepali_date_1.resolveAdDate)(input.periodTo, input.periodToBs);
        if (toResolved.date < fromResolved.date) {
            throw new common_1.BadRequestException("Invalid statement period");
        }
        return this.prisma.bankStatement.create({
            data: {
                companyId: user.companyId,
                bankAccountId: input.bankAccountId,
                periodFrom: fromResolved.date,
                periodFromBs: fromResolved.bs || null,
                periodTo: toResolved.date,
                periodToBs: toResolved.bs || null,
                openingBalance: new client_1.Prisma.Decimal(input.openingBalance),
                closingBalance: new client_1.Prisma.Decimal(input.closingBalance)
            }
        });
    }
    async addStatementLine(user, statementId, input) {
        const statement = await this.prisma.bankStatement.findFirst({
            where: { id: statementId, companyId: user.companyId }
        });
        if (!statement)
            throw new common_1.NotFoundException("Statement not found");
        const resolved = (0, nepali_date_1.resolveAdDate)(input.date, input.dateBs);
        return this.prisma.bankStatementLine.create({
            data: {
                companyId: user.companyId,
                statementId: statement.id,
                date: resolved.date,
                dateBs: resolved.bs || null,
                description: input.description,
                amount: new client_1.Prisma.Decimal(input.amount),
                debitCredit: input.debitCredit
            }
        });
    }
    async reconcile(user, input) {
        const line = await this.prisma.bankStatementLine.findFirst({
            where: { id: input.statementLineId, companyId: user.companyId }
        });
        if (!line)
            throw new common_1.NotFoundException("Statement line not found");
        if (line.matchedVoucherId)
            throw new common_1.ForbiddenException("Line already matched");
        const voucher = await this.prisma.voucher.findFirst({
            where: { id: input.voucherId, companyId: user.companyId }
        });
        if (!voucher)
            throw new common_1.BadRequestException("Voucher not found");
        if (voucher.status !== "posted")
            throw new common_1.BadRequestException("Voucher not posted");
        if (input.voucherLineId) {
            const voucherLine = await this.prisma.voucherLine.findFirst({
                where: { id: input.voucherLineId, voucherId: voucher.id, companyId: user.companyId }
            });
            if (!voucherLine)
                throw new common_1.BadRequestException("Voucher line not found");
        }
        return this.prisma.bankStatementLine.update({
            where: { id: line.id },
            data: {
                matchedVoucherId: voucher.id,
                matchedLineId: input.voucherLineId || null
            }
        });
    }
    async unmatch(user, lineId) {
        const line = await this.prisma.bankStatementLine.findFirst({
            where: { id: lineId, companyId: user.companyId }
        });
        if (!line)
            throw new common_1.NotFoundException("Statement line not found");
        if (!line.matchedVoucherId)
            throw new common_1.BadRequestException("Line not matched");
        return this.prisma.bankStatementLine.update({
            where: { id: line.id },
            data: {
                matchedVoucherId: null,
                matchedLineId: null
            }
        });
    }
    async connectBankSync(user, input) {
        if (input.bankAccountId) {
            const account = await this.prisma.bankAccount.findFirst({
                where: { id: input.bankAccountId, companyId: user.companyId }
            });
            if (!account)
                throw new common_1.BadRequestException("Bank account not found");
        }
        return {
            provider: input.provider,
            status: "pending",
            message: "Bank sync integration is not enabled yet"
        };
    }
    async syncStatus(user) {
        return {
            status: "not_configured",
            lastSyncedAt: null
        };
    }
    async refreshSync(user) {
        return {
            status: "queued",
            message: "Sync refresh is not enabled yet"
        };
    }
};
exports.BankingService = BankingService;
exports.BankingService = BankingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BankingService);
//# sourceMappingURL=banking.service.js.map