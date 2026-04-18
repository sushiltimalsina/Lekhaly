import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { bsFiscalYearRange, getCurrentBsDate } from "../../common/date/nepali-date";

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(companyId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new Error("Company not found");

    const currentBs = getCurrentBsDate();
    const fy = bsFiscalYearRange(currentBs, company.fiscalYearStartMonth || 4);

    // 1. Revenue (MTD)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const revenueLines = await this.prisma.voucherLine.findMany({
      where: {
        companyId,
        account: { type: "income" },
        voucher: { status: "posted", voucherDate: { gte: startOfMonth } }
      }
    });
    
    let totalRevenue = new Prisma.Decimal(0);
    for (const line of revenueLines) {
      totalRevenue = totalRevenue.add(line.credit.sub(line.debit));
    }

    // 2. Receivables & Payables (Current Balance)
    const allAssetLiabilityLines = await this.prisma.voucherLine.findMany({
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

    for (const line of allAssetLiabilityLines) {
      if (line.account.type === "asset") {
        const balance = line.debit.sub(line.credit);
        if (line.account.code.startsWith("11")) { // Standard code for Receivables in default data
           receivables = receivables.add(balance);
        }
        if (line.account.code.startsWith("10")) { // Standard code for Cash/Bank
           cashAtHand = cashAtHand.add(balance);
        }
      } else if (line.account.type === "liability") {
        const balance = line.credit.sub(line.debit);
        if (line.account.code.startsWith("20")) { // Standard code for Payables
           payables = payables.add(balance);
        }
      }
    }

    // 3. Recent Activity (Last 5 Vouchers)
    const recentVouchers = await this.prisma.voucher.findMany({
      where: { companyId, status: "posted" },
      orderBy: { postedAt: "desc" },
      take: 5,
      include: { party: true }
    });

    return {
      revenue: totalRevenue,
      receivables,
      payables,
      cashAtHand,
      recentActivity: recentVouchers.map(v => ({
        id: v.id,
        type: v.voucherType,
        number: v.voucherNumber,
        partyName: v.party?.name || "Multiple Accounts",
        amount: 0, // In a real system, we'd sum the lines or store the total
        date: v.voucherDate
      }))
    };
  }

  async getChartData(companyId: string) {
    // Basic implementation for the last 6 months
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
