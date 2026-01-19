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

  private formatAmount(value: Prisma.Decimal) {
    return value.toFixed(2);
  }

  private formatDateRange(filters: ReportFilters) {
    if (!filters.from && !filters.to) return "All dates";
    const from = filters.from ? filters.from.toISOString().slice(0, 10) : "Start";
    const to = filters.to ? filters.to.toISOString().slice(0, 10) : "End";
    return `${from} to ${to}`;
  }

  private buildTrialBalanceText(
    data: { rows: Array<{ accountCode: string; accountName: string; debit: Prisma.Decimal; credit: Prisma.Decimal }> },
    filters: ReportFilters
  ) {
    const lines: string[] = [];
    lines.push("TRIAL BALANCE");
    lines.push(`Period: ${this.formatDateRange(filters)}`);
    lines.push("");
    lines.push("Account Code | Account Name | Debit | Credit");
    for (const row of data.rows) {
      lines.push(
        `${row.accountCode} | ${row.accountName} | ${this.formatAmount(row.debit)} | ${this.formatAmount(row.credit)}`
      );
    }
    return lines.join("\n");
  }

  private buildProfitLossText(
    data: {
      income: Array<{ label: string; amount: Prisma.Decimal }>;
      expense: Array<{ label: string; amount: Prisma.Decimal }>;
      totalIncome: Prisma.Decimal;
      totalExpense: Prisma.Decimal;
      netProfit: Prisma.Decimal;
    },
    filters: ReportFilters
  ) {
    const lines: string[] = [];
    lines.push("PROFIT AND LOSS");
    lines.push(`Period: ${this.formatDateRange(filters)}`);
    lines.push("");
    lines.push("Income");
    for (const row of data.income) {
      lines.push(`${row.label} | ${this.formatAmount(row.amount)}`);
    }
    lines.push(`Total Income | ${this.formatAmount(data.totalIncome)}`);
    lines.push("");
    lines.push("Expense");
    for (const row of data.expense) {
      lines.push(`${row.label} | ${this.formatAmount(row.amount)}`);
    }
    lines.push(`Total Expense | ${this.formatAmount(data.totalExpense)}`);
    lines.push("");
    lines.push(`Net Profit | ${this.formatAmount(data.netProfit)}`);
    return lines.join("\n");
  }

  private buildBalanceSheetText(
    data: {
      assets: Array<{ label: string; amount: Prisma.Decimal }>;
      liabilities: Array<{ label: string; amount: Prisma.Decimal }>;
      equity: Array<{ label: string; amount: Prisma.Decimal }>;
      totalAssets: Prisma.Decimal;
      totalLiabilities: Prisma.Decimal;
      totalEquity: Prisma.Decimal;
      netProfit: Prisma.Decimal;
      totalEquityWithProfit: Prisma.Decimal;
      balanced: boolean;
    },
    filters: ReportFilters
  ) {
    const lines: string[] = [];
    lines.push("BALANCE SHEET");
    lines.push(`As of: ${this.formatDateRange(filters)}`);
    lines.push("");
    lines.push("Assets");
    for (const row of data.assets) {
      lines.push(`${row.label} | ${this.formatAmount(row.amount)}`);
    }
    lines.push(`Total Assets | ${this.formatAmount(data.totalAssets)}`);
    lines.push("");
    lines.push("Liabilities");
    for (const row of data.liabilities) {
      lines.push(`${row.label} | ${this.formatAmount(row.amount)}`);
    }
    lines.push(`Total Liabilities | ${this.formatAmount(data.totalLiabilities)}`);
    lines.push("");
    lines.push("Equity");
    for (const row of data.equity) {
      lines.push(`${row.label} | ${this.formatAmount(row.amount)}`);
    }
    lines.push(`Total Equity | ${this.formatAmount(data.totalEquity)}`);
    lines.push(`Net Profit | ${this.formatAmount(data.netProfit)}`);
    lines.push(`Total Equity With Profit | ${this.formatAmount(data.totalEquityWithProfit)}`);
    lines.push(`Balanced | ${data.balanced ? "true" : "false"}`);
    return lines.join("\n");
  }

  private toCsv(rows: Array<Record<string, unknown>>) {
    if (rows.length === 0) return "";
    const headers = Object.keys(rows[0]);
    const escape = (value: unknown) => {
      if (value === null || value === undefined) return "";
      const text = String(value);
      if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
        return `"${text.replace(/\"/g, "\"\"")}"`;
      }
      return text;
    };
    const lines = [headers.join(",")];
    for (const row of rows) {
      lines.push(headers.map((key) => escape(row[key])).join(","));
    }
    return lines.join("\n");
  }

  private buildTrialBalanceCsv(data: {
    rows: Array<{ accountCode: string; accountName: string; debit: Prisma.Decimal; credit: Prisma.Decimal }>;
    totalDebit: Prisma.Decimal;
    totalCredit: Prisma.Decimal;
  }) {
    const rows = data.rows.map((row) => ({
      accountCode: row.accountCode,
      accountName: row.accountName,
      debit: this.formatAmount(row.debit),
      credit: this.formatAmount(row.credit)
    }));
    rows.push({
      accountCode: "TOTAL",
      accountName: "",
      debit: this.formatAmount(data.totalDebit),
      credit: this.formatAmount(data.totalCredit)
    });
    return this.toCsv(rows);
  }

  private buildProfitLossCsv(data: {
    income: Array<{ label: string; amount: Prisma.Decimal }>;
    expense: Array<{ label: string; amount: Prisma.Decimal }>;
    totalIncome: Prisma.Decimal;
    totalExpense: Prisma.Decimal;
    netProfit: Prisma.Decimal;
  }) {
    const rows: Array<Record<string, string>> = [];
    for (const row of data.income) {
      rows.push({ section: "income", label: row.label, amount: this.formatAmount(row.amount) });
    }
    rows.push({ section: "income", label: "Total Income", amount: this.formatAmount(data.totalIncome) });
    for (const row of data.expense) {
      rows.push({ section: "expense", label: row.label, amount: this.formatAmount(row.amount) });
    }
    rows.push({ section: "expense", label: "Total Expense", amount: this.formatAmount(data.totalExpense) });
    rows.push({ section: "summary", label: "Net Profit", amount: this.formatAmount(data.netProfit) });
    return this.toCsv(rows);
  }

  private buildBalanceSheetCsv(data: {
    assets: Array<{ label: string; amount: Prisma.Decimal }>;
    liabilities: Array<{ label: string; amount: Prisma.Decimal }>;
    equity: Array<{ label: string; amount: Prisma.Decimal }>;
    totalAssets: Prisma.Decimal;
    totalLiabilities: Prisma.Decimal;
    totalEquity: Prisma.Decimal;
    netProfit: Prisma.Decimal;
    totalEquityWithProfit: Prisma.Decimal;
    balanced: boolean;
  }) {
    const rows: Array<Record<string, string>> = [];
    for (const row of data.assets) {
      rows.push({ section: "assets", label: row.label, amount: this.formatAmount(row.amount) });
    }
    rows.push({ section: "assets", label: "Total Assets", amount: this.formatAmount(data.totalAssets) });
    for (const row of data.liabilities) {
      rows.push({ section: "liabilities", label: row.label, amount: this.formatAmount(row.amount) });
    }
    rows.push({ section: "liabilities", label: "Total Liabilities", amount: this.formatAmount(data.totalLiabilities) });
    for (const row of data.equity) {
      rows.push({ section: "equity", label: row.label, amount: this.formatAmount(row.amount) });
    }
    rows.push({ section: "equity", label: "Total Equity", amount: this.formatAmount(data.totalEquity) });
    rows.push({ section: "equity", label: "Net Profit", amount: this.formatAmount(data.netProfit) });
    rows.push({
      section: "equity",
      label: "Total Equity With Profit",
      amount: this.formatAmount(data.totalEquityWithProfit)
    });
    rows.push({ section: "summary", label: "Balanced", amount: data.balanced ? "true" : "false" });
    return this.toCsv(rows);
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

  async exportPdf(companyId: string, input: { report: string; format?: string; from?: Date; to?: Date }) {
    const filters = { from: input.from, to: input.to };
    let data: any;
    let contentText = "";
    let contentType = "application/pdf";
    let format = input.format || "pdf";

    if (input.report === "trial-balance") {
      data = await this.trialBalance(companyId, filters);
      contentText =
        format === "csv" ? this.buildTrialBalanceCsv(data) : this.buildTrialBalanceText(data, filters);
    } else if (input.report === "profit-loss") {
      data = await this.profitAndLoss(companyId, filters);
      contentText =
        format === "csv" ? this.buildProfitLossCsv(data) : this.buildProfitLossText(data, filters);
    } else if (input.report === "balance-sheet") {
      data = await this.balanceSheet(companyId, filters);
      contentText =
        format === "csv" ? this.buildBalanceSheetCsv(data) : this.buildBalanceSheetText(data, filters);
    } else {
      data = { message: "Unknown report" };
      contentText = "Unknown report";
    }

    const contentBase64 = Buffer.from(contentText, "utf8").toString("base64");
    const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const extension = format === "csv" ? "csv" : "pdf";
    if (format === "csv") {
      contentType = "text/csv";
    }
    const fileName = `${input.report}-${dateStamp}.${extension}`;

    return {
      report: input.report,
      generatedAt: new Date(),
      format,
      fileName,
      contentType,
      contentBase64,
      data
    };
  }
}
