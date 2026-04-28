import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CoaType, Prisma } from "@prisma/client";

@Injectable()
export class CoaSeederService {
  constructor(private prisma: PrismaService) {}

  /**
   * Seeds the standard NFRS account hierarchy for a company.
   * Following the standard 4-digit code system for Nepal.
   */
  async seedNfrs(tx: Prisma.TransactionClient, companyId: string) {
    // 1000 SERIES: ASSETS
    const assets = await tx.chartOfAccount.create({
      data: {
        companyId,
        code: "1000",
        name: "Assets",
        type: CoaType.asset,
        isGroup: true,
        level: 0,
        isPostable: false,
      },
    });

    const currentAssets = await tx.chartOfAccount.create({
      data: {
        companyId,
        code: "1100",
        name: "Current Assets",
        type: CoaType.asset,
        parentId: assets.id,
        isGroup: true,
        level: 1,
        isPostable: false,
      },
    });

    const cashAndBank = await tx.chartOfAccount.create({
      data: {
        companyId,
        code: "1110",
        name: "Cash and Bank",
        type: CoaType.asset,
        parentId: currentAssets.id,
        isGroup: true,
        level: 2,
        isPostable: false,
      },
    });

    // Leaf Accounts for Cash and Bank
    const cash = await tx.chartOfAccount.create({
      data: {
        companyId,
        code: "1111",
        name: "Cash in Hand",
        type: CoaType.asset,
        parentId: cashAndBank.id,
        isGroup: false,
        level: 3,
        isPostable: true,
      },
    });

    const bank = await tx.chartOfAccount.create({
      data: {
        companyId,
        code: "1112",
        name: "Bank Accounts",
        type: CoaType.asset,
        parentId: cashAndBank.id,
        isGroup: false,
        level: 3,
        isPostable: true,
      },
    });

    const receivables = await tx.chartOfAccount.create({
      data: {
        companyId,
        code: "1120",
        name: "Trade and Other Receivables",
        type: CoaType.asset,
        parentId: currentAssets.id,
        isGroup: true,
        level: 2,
        isPostable: false,
      },
    });

    const accountsReceivable = await tx.chartOfAccount.create({
      data: {
        companyId,
        code: "1121",
        name: "Accounts Receivable",
        type: CoaType.asset,
        parentId: receivables.id,
        isGroup: false,
        level: 3,
        isPostable: true,
      },
    });

    const vatReceivable = await tx.chartOfAccount.create({
      data: {
        companyId,
        code: "1122",
        name: "VAT Receivable",
        type: CoaType.asset,
        parentId: receivables.id,
        isGroup: false,
        level: 3,
        isPostable: true,
      },
    });

    const inventory = await tx.chartOfAccount.create({
      data: {
        companyId,
        code: "1130",
        name: "Inventory",
        type: CoaType.asset,
        parentId: currentAssets.id,
        isGroup: false,
        level: 2,
        isPostable: true,
      },
    });

    const nonCurrentAssets = await tx.chartOfAccount.create({
      data: {
        companyId,
        code: "1200",
        name: "Non-Current Assets",
        type: CoaType.asset,
        parentId: assets.id,
        isGroup: true,
        level: 1,
        isPostable: false,
      },
    });

    const ppe = await tx.chartOfAccount.create({
      data: {
        companyId,
        code: "1210",
        name: "Property, Plant and Equipment",
        type: CoaType.asset,
        parentId: nonCurrentAssets.id,
        isGroup: false,
        level: 2,
        isPostable: true,
      },
    });

    // 2000 SERIES: EQUITY
    const equity = await tx.chartOfAccount.create({
      data: {
        companyId,
        code: "2000",
        name: "Equity",
        type: CoaType.equity,
        isGroup: true,
        level: 0,
        isPostable: false,
      },
    });

    const shareCapital = await tx.chartOfAccount.create({
      data: {
        companyId,
        code: "2100",
        name: "Share Capital",
        type: CoaType.equity,
        parentId: equity.id,
        isGroup: false,
        level: 1,
        isPostable: true,
      },
    });

    const retainedEarnings = await tx.chartOfAccount.create({
      data: {
        companyId,
        code: "2200",
        name: "Retained Earnings",
        type: CoaType.equity,
        parentId: equity.id,
        isGroup: false,
        level: 1,
        isPostable: true,
      },
    });

    // 3000 SERIES: LIABILITIES
    const liabilities = await tx.chartOfAccount.create({
      data: {
        companyId,
        code: "3000",
        name: "Liabilities",
        type: CoaType.liability,
        isGroup: true,
        level: 0,
        isPostable: false,
      },
    });

    const currentLiabilities = await tx.chartOfAccount.create({
      data: {
        companyId,
        code: "3100",
        name: "Current Liabilities",
        type: CoaType.liability,
        parentId: liabilities.id,
        isGroup: true,
        level: 1,
        isPostable: false,
      },
    });

    const payables = await tx.chartOfAccount.create({
      data: {
        companyId,
        code: "3110",
        name: "Trade and Other Payables",
        type: CoaType.liability,
        parentId: currentLiabilities.id,
        isGroup: true,
        level: 2,
        isPostable: false,
      },
    });

    const accountsPayable = await tx.chartOfAccount.create({
      data: {
        companyId,
        code: "3111",
        name: "Accounts Payable",
        type: CoaType.liability,
        parentId: payables.id,
        isGroup: false,
        level: 3,
        isPostable: true,
      },
    });

    const vatPayable = await tx.chartOfAccount.create({
      data: {
        companyId,
        code: "3112",
        name: "VAT Payable",
        type: CoaType.liability,
        parentId: payables.id,
        isGroup: false,
        level: 3,
        isPostable: true,
      },
    });

    // 4000 SERIES: INCOME
    const income = await tx.chartOfAccount.create({
      data: {
        companyId,
        code: "4000",
        name: "Income",
        type: CoaType.income,
        isGroup: true,
        level: 0,
        isPostable: false,
      },
    });

    const revenue = await tx.chartOfAccount.create({
      data: {
        companyId,
        code: "4100",
        name: "Revenue from Operations",
        type: CoaType.income,
        parentId: income.id,
        isGroup: true,
        level: 1,
        isPostable: false,
      },
    });

    const sales = await tx.chartOfAccount.create({
      data: {
        companyId,
        code: "4110",
        name: "Sales",
        type: CoaType.income,
        parentId: revenue.id,
        isGroup: false,
        level: 2,
        isPostable: true,
      },
    });

    const discountGiven = await tx.chartOfAccount.create({
      data: {
        companyId,
        code: "4120",
        name: "Discount Given",
        type: CoaType.income,
        parentId: revenue.id,
        isGroup: false,
        level: 2,
        isPostable: true,
      },
    });

    const otherIncome = await tx.chartOfAccount.create({
      data: {
        companyId,
        code: "4200",
        name: "Other Income",
        type: CoaType.income,
        parentId: income.id,
        isGroup: false,
        level: 1,
        isPostable: true,
      },
    });

    // 5000 SERIES: EXPENSES
    const expenses = await tx.chartOfAccount.create({
      data: {
        companyId,
        code: "5000",
        name: "Expenses",
        type: CoaType.expense,
        isGroup: true,
        level: 0,
        isPostable: false,
      },
    });

    const cogsGroup = await tx.chartOfAccount.create({
      data: {
        companyId,
        code: "5100",
        name: "Cost of Sales",
        type: CoaType.expense,
        parentId: expenses.id,
        isGroup: true,
        level: 1,
        isPostable: false,
      },
    });

    const cogs = await tx.chartOfAccount.create({
      data: {
        companyId,
        code: "5110",
        name: "Cost of Goods Sold",
        type: CoaType.expense,
        parentId: cogsGroup.id,
        isGroup: false,
        level: 2,
        isPostable: true,
      },
    });

    const adminExpenses = await tx.chartOfAccount.create({
      data: {
        companyId,
        code: "5200",
        name: "Administrative Expenses",
        type: CoaType.expense,
        parentId: expenses.id,
        isGroup: false,
        level: 1,
        isPostable: true,
      },
    });

    return {
      cash,
      bank,
      accountsReceivable,
      vatReceivable,
      accountsPayable,
      vatPayable,
      sales,
      discountGiven,
      cogs,
    };
  }
}
