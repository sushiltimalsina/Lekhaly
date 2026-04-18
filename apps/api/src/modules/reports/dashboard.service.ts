import { Injectable } from "@nestjs/common";
import { Prisma, VoucherType } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { bsFiscalYearRange, getCurrentBsDate, adToBsDate, bsToAdDate, parseBsDate } from "../../common/date/nepali-date";

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(companyId: string, calendar: "AD" | "BS" = "BS") {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new Error("Company not found");

    const now = new Date();
    let curStart, curEnd, prevStart, prevEnd;

    if (calendar === "BS") {
      const { year, month } = parseBsDate(adToBsDate(now));
      
      // Current BS Month
      curStart = bsToAdDate(`${year}-${month.toString().padStart(2, '0')}-01`);
      curEnd = now;

      // Previous BS Month
      let pYear = year;
      let pMonth = month - 1;
      if (pMonth === 0) {
        pMonth = 12;
        pYear -= 1;
      }
      prevStart = bsToAdDate(`${pYear}-${pMonth.toString().padStart(2, '0')}-01`);
      // Last day of previous month is the day before the start of the current month
      prevEnd = new Date(curStart.getTime() - 1);
    } else {
      // Current Gregorian Month
      curStart = new Date(now.getFullYear(), now.getMonth(), 1);
      curEnd = now;

      // Previous Gregorian Month
      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    }

    const [curData, prevData] = await Promise.all([
      this.getPeriodSummary(companyId, curStart, curEnd),
      this.getPeriodSummary(companyId, prevStart, prevEnd)
    ]);

    // Calculate Trends
    const calcTrend = (cur: Prisma.Decimal, prev: Prisma.Decimal) => {
      if (prev.isZero()) return cur.isZero() ? 0 : 100;
      return cur.sub(prev).div(prev).mul(100).toNumber();
    };

    // Current Balances (Snapshot - ignores periods)
    const snapshot = await this.getCurrentBalances(companyId);

    // Recent Activity with amounts
    const recentVouchers = await this.prisma.voucher.findMany({
      where: { companyId, status: "posted" },
      orderBy: { postedAt: "desc" },
      take: 6,
      include: { 
        party: true,
        lines: { select: { debit: true, credit: true } }
      }
    });

    const recentActivity = recentVouchers.map(v => {
      const amount = v.lines.reduce((sum, l) => {
        return sum.add(l.debit);
      }, new Prisma.Decimal(0));

      return {
        id: v.id,
        type: v.voucherType,
        number: v.voucherNumber,
        partyName: v.party?.name || (v.memo ? v.memo.substring(0, 20) : "Multiple Accounts"),
        amount: amount.toNumber(),
        date: v.voucherDate
      };
    });

    // Health Ratios
    const quickRatio = prevData.payables.isZero() ? 0 : snapshot.cashAtHand.add(snapshot.receivables).div(prevData.payables).toNumber();
    
    // Expenses for last 3 months for burn rate
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const threeMonthExpenses = await this.prisma.voucherLine.aggregate({
        where: {
            companyId,
            account: { type: "expense" },
            voucher: { status: "posted", voucherDate: { gte: threeMonthsAgo } }
        },
        _sum: { debit: true, credit: true }
    });
    const totalExp = (threeMonthExpenses._sum.debit || new Prisma.Decimal(0)).sub(threeMonthExpenses._sum.credit || new Prisma.Decimal(0));
    const burnRate = totalExp.div(3);
    const runway = burnRate.isZero() ? 99 : snapshot.cashAtHand.div(burnRate).toNumber();

    return {
      revenue: curData.revenue.toNumber(),
      revenueTrend: calcTrend(curData.revenue, prevData.revenue),
      
      receivables: snapshot.receivables.toNumber(),
      receivablesTrend: calcTrend(snapshot.receivables, prevData.receivables),
      
      payables: snapshot.payables.toNumber(),
      payablesTrend: calcTrend(snapshot.payables, prevData.payables),
      
      cashAtHand: snapshot.cashAtHand.toNumber(),
      cashTrend: calcTrend(snapshot.cashAtHand, prevData.cash),

      quickRatio: Number(quickRatio.toFixed(1)),
      burnRate: burnRate.toNumber(),
      runway: Math.round(runway),
      
      recentActivity
    };
  }

  private async getPeriodSummary(companyId: string, start: Date, end: Date) {
    const lines = await this.prisma.voucherLine.findMany({
      where: {
        companyId,
        voucher: { status: "posted", voucherDate: { gte: start, lte: end } }
      },
      include: { account: true }
    });

    let revenue = new Prisma.Decimal(0);
    let expenses = new Prisma.Decimal(0);
    let receivables = new Prisma.Decimal(0);
    let payables = new Prisma.Decimal(0);
    let cash = new Prisma.Decimal(0);

    for (const line of lines) {
      const val = line.debit.sub(line.credit);
      const absVal = line.credit.sub(line.debit);

      if (line.account.type === "income") revenue = revenue.add(absVal);
      if (line.account.type === "expense") expenses = expenses.add(val);
      
      if (line.account.type === "asset") {
          // Cash/Bank: 10, 11
          if (line.account.code.startsWith("10") || line.account.code.startsWith("11")) cash = cash.add(val);
          // Receivables: 11, 12, 13
          if (line.account.code.startsWith("11") || line.account.code.startsWith("12") || line.account.code.startsWith("13")) receivables = receivables.add(val);
      }
      if (line.account.type === "liability") {
          // Payables: 20, 21
          if (line.account.code.startsWith("20") || line.account.code.startsWith("21")) payables = payables.add(absVal);
      }
    }

    return { revenue, expenses, receivables, payables, cash };
  }

  private async getCurrentBalances(companyId: string) {
    const lines = await this.prisma.voucherLine.findMany({
      where: {
        companyId,
        account: { type: { in: ["asset", "liability"] } },
        voucher: { status: "posted" }
      },
      include: { account: true }
    });

    let receivables = new Prisma.Decimal(0);
    let payables = new Prisma.Decimal(0);
    let cashAtHand = new Prisma.Decimal(0);

    for (const line of lines) {
       const assetBal = line.debit.sub(line.credit);
       const liabBal = line.credit.sub(line.debit);

       if (line.account.type === "asset") {
           // Receivables: 11, 12, 13
           if (line.account.code.startsWith("11") || line.account.code.startsWith("12") || line.account.code.startsWith("13")) receivables = receivables.add(assetBal);
           // Cash/Bank: 10, 11
           if (line.account.code.startsWith("10") || line.account.code.startsWith("11")) cashAtHand = cashAtHand.add(assetBal);
       } else if (line.account.type === "liability") {
           // Payables: 20, 21
           if (line.account.code.startsWith("20") || line.account.code.startsWith("21")) payables = payables.add(liabBal);
       }
    }

    return { receivables, payables, cashAtHand };
  }

  async getChartData(companyId: string) {
    const today = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        months.push({
            name: d.toLocaleString('default', { month: 'short' }),
            start: new Date(d.getFullYear(), d.getMonth(), 1),
            end: new Date(d.getFullYear(), d.getMonth() + 1, 0),
            revenue: new Prisma.Decimal(0),
            expense: new Prisma.Decimal(0)
        });
    }

    const lines = await this.prisma.voucherLine.findMany({
      where: {
        companyId,
        account: { type: { in: ["income", "expense"] } },
        voucher: { status: "posted", voucherDate: { gte: months[0].start } }
      },
      include: { account: true, voucher: true }
    });

    for (const line of lines) {
        const month = months.find(m => line.voucher.voucherDate >= m.start && line.voucher.voucherDate <= m.end);
        if (!month) continue;

        if (line.account.type === "income") {
            month.revenue = month.revenue.add(line.credit.sub(line.debit));
        } else {
            month.expense = month.expense.add(line.debit.sub(line.credit));
        }
    }

    return months.map(m => ({
        name: m.name,
        revenue: m.revenue,
        expense: m.expense
      }));
  }
}
