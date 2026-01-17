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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let ReportsService = class ReportsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    sumLines(lines) {
        let debit = new client_1.Prisma.Decimal(0);
        let credit = new client_1.Prisma.Decimal(0);
        for (const line of lines) {
            debit = debit.add(line.debit);
            credit = credit.add(line.credit);
        }
        return { debit, credit };
    }
    applyDateFilter(filters) {
        if (!filters.from && !filters.to)
            return undefined;
        const voucherDate = {};
        if (filters.from)
            voucherDate.gte = filters.from;
        if (filters.to)
            voucherDate.lte = filters.to;
        return voucherDate;
    }
    async trialBalance(companyId, filters) {
        const voucherDate = this.applyDateFilter(filters);
        const lines = await this.prisma.voucherLine.findMany({
            where: {
                companyId,
                voucher: {
                    status: "posted",
                    ...(voucherDate ? { voucherDate } : {})
                }
            },
            include: { account: true }
        });
        const byAccount = new Map();
        for (const line of lines) {
            const key = line.accountId;
            const curr = byAccount.get(key) || {
                code: line.account.code,
                name: line.account.name,
                debit: new client_1.Prisma.Decimal(0),
                credit: new client_1.Prisma.Decimal(0)
            };
            curr.debit = curr.debit.add(line.debit);
            curr.credit = curr.credit.add(line.credit);
            byAccount.set(key, curr);
        }
        const rows = Array.from(byAccount.values()).map((row) => ({
            accountCode: row.code,
            accountName: row.name,
            debit: row.debit,
            credit: row.credit
        }));
        const totals = this.sumLines(rows);
        const balanced = totals.debit.equals(totals.credit);
        return { rows, totalDebit: totals.debit, totalCredit: totals.credit, balanced };
    }
    async profitAndLoss(companyId, filters) {
        const voucherDate = this.applyDateFilter(filters);
        const lines = await this.prisma.voucherLine.findMany({
            where: {
                companyId,
                voucher: {
                    status: "posted",
                    ...(voucherDate ? { voucherDate } : {})
                }
            },
            include: { account: true }
        });
        const income = new Map();
        const expense = new Map();
        for (const line of lines) {
            const key = `${line.account.code} ${line.account.name}`;
            if (line.account.type === "income") {
                const net = line.credit.sub(line.debit);
                income.set(key, (income.get(key) || new client_1.Prisma.Decimal(0)).add(net));
            }
            if (line.account.type === "expense") {
                const net = line.debit.sub(line.credit);
                expense.set(key, (expense.get(key) || new client_1.Prisma.Decimal(0)).add(net));
            }
        }
        const incomeRows = Array.from(income.entries()).map(([label, amount]) => ({
            label,
            amount
        }));
        const expenseRows = Array.from(expense.entries()).map(([label, amount]) => ({
            label,
            amount
        }));
        const totalIncome = incomeRows.reduce((acc, r) => acc.add(r.amount), new client_1.Prisma.Decimal(0));
        const totalExpense = expenseRows.reduce((acc, r) => acc.add(r.amount), new client_1.Prisma.Decimal(0));
        const netProfit = totalIncome.sub(totalExpense);
        return { income: incomeRows, expense: expenseRows, totalIncome, totalExpense, netProfit };
    }
    async balanceSheet(companyId, filters) {
        const voucherDate = this.applyDateFilter(filters);
        const lines = await this.prisma.voucherLine.findMany({
            where: {
                companyId,
                voucher: {
                    status: "posted",
                    ...(voucherDate ? { voucherDate } : {})
                }
            },
            include: { account: true }
        });
        const assets = new Map();
        const liabilities = new Map();
        const equity = new Map();
        const income = new Map();
        const expense = new Map();
        for (const line of lines) {
            const key = `${line.account.code} ${line.account.name}`;
            if (line.account.type === "asset") {
                const net = line.debit.sub(line.credit);
                assets.set(key, (assets.get(key) || new client_1.Prisma.Decimal(0)).add(net));
            }
            if (line.account.type === "liability") {
                const net = line.credit.sub(line.debit);
                liabilities.set(key, (liabilities.get(key) || new client_1.Prisma.Decimal(0)).add(net));
            }
            if (line.account.type === "equity") {
                const net = line.credit.sub(line.debit);
                equity.set(key, (equity.get(key) || new client_1.Prisma.Decimal(0)).add(net));
            }
            if (line.account.type === "income") {
                const net = line.credit.sub(line.debit);
                income.set(key, (income.get(key) || new client_1.Prisma.Decimal(0)).add(net));
            }
            if (line.account.type === "expense") {
                const net = line.debit.sub(line.credit);
                expense.set(key, (expense.get(key) || new client_1.Prisma.Decimal(0)).add(net));
            }
        }
        const assetRows = Array.from(assets.entries()).map(([label, amount]) => ({ label, amount }));
        const liabilityRows = Array.from(liabilities.entries()).map(([label, amount]) => ({ label, amount }));
        const equityRows = Array.from(equity.entries()).map(([label, amount]) => ({ label, amount }));
        const totalAssets = assetRows.reduce((acc, r) => acc.add(r.amount), new client_1.Prisma.Decimal(0));
        const totalLiabilities = liabilityRows.reduce((acc, r) => acc.add(r.amount), new client_1.Prisma.Decimal(0));
        const totalEquity = equityRows.reduce((acc, r) => acc.add(r.amount), new client_1.Prisma.Decimal(0));
        const totalIncome = Array.from(income.values()).reduce((acc, v) => acc.add(v), new client_1.Prisma.Decimal(0));
        const totalExpense = Array.from(expense.values()).reduce((acc, v) => acc.add(v), new client_1.Prisma.Decimal(0));
        const netProfit = totalIncome.sub(totalExpense);
        const totalEquityWithProfit = totalEquity.add(netProfit);
        const balanced = totalAssets.equals(totalLiabilities.add(totalEquityWithProfit));
        return {
            assets: assetRows,
            liabilities: liabilityRows,
            equity: equityRows,
            totalAssets,
            totalLiabilities,
            totalEquity,
            netProfit,
            totalEquityWithProfit,
            balanced
        };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map