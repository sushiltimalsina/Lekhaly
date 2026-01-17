import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";

type ReportFilters = { from?: Date; to?: Date };

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private sumLines(lines: { debit: Prisma.Decimal; credit: Prisma.Decimal }[]) {
    let debit = new Prisma.Decimal(0);
    let credit = new Prisma.Decimal(0);
    for (const line of lines) {
      debit = debit.add(line.debit);
      credit = credit.add(line.credit);
    }
    return { debit, credit };
  }

  private applyDateFilter(filters: ReportFilters) {
    if (!filters.from && !filters.to) return undefined;
    const voucherDate: Prisma.DateTimeFilter = {};
    if (filters.from) voucherDate.gte = filters.from;
    if (filters.to) voucherDate.lte = filters.to;
    return voucherDate;
  }

  async trialBalance(companyId: string, filters: ReportFilters) {
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

    const byAccount = new Map<string, { code: string; name: string; debit: Prisma.Decimal; credit: Prisma.Decimal }>();
    for (const line of lines) {
      const key = line.accountId;
      const curr = byAccount.get(key) || {
        code: line.account.code,
        name: line.account.name,
        debit: new Prisma.Decimal(0),
        credit: new Prisma.Decimal(0)
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

  async profitAndLoss(companyId: string, filters: ReportFilters) {
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

    const income = new Map<string, Prisma.Decimal>();
    const expense = new Map<string, Prisma.Decimal>();

    for (const line of lines) {
      const key = `${line.account.code} ${line.account.name}`;
      if (line.account.type === "income") {
        const net = line.credit.sub(line.debit);
        income.set(key, (income.get(key) || new Prisma.Decimal(0)).add(net));
      }
      if (line.account.type === "expense") {
        const net = line.debit.sub(line.credit);
        expense.set(key, (expense.get(key) || new Prisma.Decimal(0)).add(net));
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

    const totalIncome = incomeRows.reduce((acc, r) => acc.add(r.amount), new Prisma.Decimal(0));
    const totalExpense = expenseRows.reduce((acc, r) => acc.add(r.amount), new Prisma.Decimal(0));
    const netProfit = totalIncome.sub(totalExpense);

    return { income: incomeRows, expense: expenseRows, totalIncome, totalExpense, netProfit };
  }

  async balanceSheet(companyId: string, filters: ReportFilters) {
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

    const assets = new Map<string, Prisma.Decimal>();
    const liabilities = new Map<string, Prisma.Decimal>();
    const equity = new Map<string, Prisma.Decimal>();
    const income = new Map<string, Prisma.Decimal>();
    const expense = new Map<string, Prisma.Decimal>();

    for (const line of lines) {
      const key = `${line.account.code} ${line.account.name}`;
      if (line.account.type === "asset") {
        const net = line.debit.sub(line.credit);
        assets.set(key, (assets.get(key) || new Prisma.Decimal(0)).add(net));
      }
      if (line.account.type === "liability") {
        const net = line.credit.sub(line.debit);
        liabilities.set(key, (liabilities.get(key) || new Prisma.Decimal(0)).add(net));
      }
      if (line.account.type === "equity") {
        const net = line.credit.sub(line.debit);
        equity.set(key, (equity.get(key) || new Prisma.Decimal(0)).add(net));
      }
      if (line.account.type === "income") {
        const net = line.credit.sub(line.debit);
        income.set(key, (income.get(key) || new Prisma.Decimal(0)).add(net));
      }
      if (line.account.type === "expense") {
        const net = line.debit.sub(line.credit);
        expense.set(key, (expense.get(key) || new Prisma.Decimal(0)).add(net));
      }
    }

    const assetRows = Array.from(assets.entries()).map(([label, amount]) => ({ label, amount }));
    const liabilityRows = Array.from(liabilities.entries()).map(([label, amount]) => ({ label, amount }));
    const equityRows = Array.from(equity.entries()).map(([label, amount]) => ({ label, amount }));

    const totalAssets = assetRows.reduce((acc, r) => acc.add(r.amount), new Prisma.Decimal(0));
    const totalLiabilities = liabilityRows.reduce((acc, r) => acc.add(r.amount), new Prisma.Decimal(0));
    const totalEquity = equityRows.reduce((acc, r) => acc.add(r.amount), new Prisma.Decimal(0));
    const totalIncome = Array.from(income.values()).reduce((acc, v) => acc.add(v), new Prisma.Decimal(0));
    const totalExpense = Array.from(expense.values()).reduce((acc, v) => acc.add(v), new Prisma.Decimal(0));
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
}
