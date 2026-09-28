import { Injectable } from "@nestjs/common";
import { CoaType, Prisma } from "@prisma/client";

type DefaultAccount = {
  code: string;
  name: string;
  type: CoaType;
  parentCode?: string;
  isGroup: boolean;
  level: number;
  isContra?: boolean;
};

export const DEFAULT_ACCOUNTS: DefaultAccount[] = [
  { code: "1000", name: "Assets", type: CoaType.asset, isGroup: true, level: 0 },
  { code: "1100", name: "Current Assets", type: CoaType.asset, parentCode: "1000", isGroup: true, level: 1 },
  { code: "1110", name: "Cash and Bank", type: CoaType.asset, parentCode: "1100", isGroup: true, level: 2 },
  { code: "1111", name: "Cash in Hand", type: CoaType.asset, parentCode: "1110", isGroup: false, level: 3 },
  { code: "1112", name: "Bank Accounts", type: CoaType.asset, parentCode: "1110", isGroup: false, level: 3 },
  { code: "1120", name: "Trade and Other Receivables", type: CoaType.asset, parentCode: "1100", isGroup: true, level: 2 },
  { code: "1121", name: "Accounts Receivable", type: CoaType.asset, parentCode: "1120", isGroup: false, level: 3 },
  { code: "1122", name: "VAT Receivable", type: CoaType.asset, parentCode: "1120", isGroup: false, level: 3 },
  { code: "1130", name: "Inventory", type: CoaType.asset, parentCode: "1100", isGroup: false, level: 2 },
  { code: "1200", name: "Non-Current Assets", type: CoaType.asset, parentCode: "1000", isGroup: true, level: 1 },
  { code: "1210", name: "Property, Plant and Equipment", type: CoaType.asset, parentCode: "1200", isGroup: false, level: 2 },
  { code: "2000", name: "Equity", type: CoaType.equity, isGroup: true, level: 0 },
  { code: "2100", name: "Share Capital", type: CoaType.equity, parentCode: "2000", isGroup: false, level: 1 },
  { code: "2200", name: "Retained Earnings", type: CoaType.equity, parentCode: "2000", isGroup: false, level: 1 },
  { code: "3000", name: "Liabilities", type: CoaType.liability, isGroup: true, level: 0 },
  { code: "3100", name: "Current Liabilities", type: CoaType.liability, parentCode: "3000", isGroup: true, level: 1 },
  { code: "3110", name: "Trade and Other Payables", type: CoaType.liability, parentCode: "3100", isGroup: true, level: 2 },
  { code: "3111", name: "Accounts Payable", type: CoaType.liability, parentCode: "3110", isGroup: false, level: 3 },
  { code: "3112", name: "VAT Payable", type: CoaType.liability, parentCode: "3110", isGroup: false, level: 3 },
  { code: "3200", name: "Long-Term Liabilities", type: CoaType.liability, parentCode: "3000", isGroup: true, level: 1 },
  { code: "3210", name: "Loans Payable", type: CoaType.liability, parentCode: "3200", isGroup: false, level: 2 },
  { code: "4000", name: "Income", type: CoaType.income, isGroup: true, level: 0 },
  { code: "4100", name: "Revenue from Operations", type: CoaType.income, parentCode: "4000", isGroup: true, level: 1 },
  { code: "4110", name: "Sales", type: CoaType.income, parentCode: "4100", isGroup: false, level: 2 },
  { code: "4120", name: "Sales Discount Given", type: CoaType.income, parentCode: "4100", isGroup: false, level: 2, isContra: true },
  { code: "4200", name: "Other Income", type: CoaType.income, parentCode: "4000", isGroup: true, level: 1 },
  { code: "4210", name: "Interest Income", type: CoaType.income, parentCode: "4200", isGroup: false, level: 2 },
  { code: "5000", name: "Expenses", type: CoaType.expense, isGroup: true, level: 0 },
  { code: "5100", name: "Cost of Sales", type: CoaType.expense, parentCode: "5000", isGroup: true, level: 1 },
  { code: "5110", name: "Cost of Goods Sold", type: CoaType.expense, parentCode: "5100", isGroup: false, level: 2 },
  { code: "5120", name: "Purchase Discount Received", type: CoaType.expense, parentCode: "5100", isGroup: false, level: 2, isContra: true },
  { code: "5200", name: "Operating Expenses", type: CoaType.expense, parentCode: "5000", isGroup: true, level: 1 },
  { code: "5210", name: "Administrative Expenses", type: CoaType.expense, parentCode: "5200", isGroup: true, level: 2 },
  { code: "5211", name: "Rent", type: CoaType.expense, parentCode: "5210", isGroup: false, level: 3 },
  { code: "5212", name: "Salaries and Wages", type: CoaType.expense, parentCode: "5210", isGroup: false, level: 3 },
  { code: "5213", name: "Utilities", type: CoaType.expense, parentCode: "5210", isGroup: false, level: 3 },
  { code: "5214", name: "Bank Charges", type: CoaType.expense, parentCode: "5210", isGroup: false, level: 3 },
];

@Injectable()
export class CoaSeederService {
  async seedNfrs(tx: Prisma.TransactionClient, companyId: string) {
    const accounts = new Map<string, { id: string }>();

    for (const definition of DEFAULT_ACCOUNTS) {
      const parentId = definition.parentCode ? accounts.get(definition.parentCode)?.id : null;
      const data = {
        companyId,
        code: definition.code,
        name: definition.name,
        type: definition.type,
        parentId,
        isGroup: definition.isGroup,
        isPostable: !definition.isGroup,
        isActive: true,
        isContra: definition.isContra ?? false,
        level: definition.level,
      };
      const account = await tx.chartOfAccount.upsert({
        where: { companyId_code: { companyId, code: definition.code } },
        create: data,
        update: data,
      });
      accounts.set(definition.code, account);
    }

    const getAccount = (code: string) => {
      const account = accounts.get(code);
      if (!account) throw new Error(`Default COA account ${code} was not seeded.`);
      return account;
    };

    return {
      cash: getAccount("1111"),
      bank: getAccount("1112"),
      accountsReceivable: getAccount("1121"),
      vatReceivable: getAccount("1122"),
      accountsPayable: getAccount("3111"),
      vatPayable: getAccount("3112"),
      sales: getAccount("4110"),
      discountGiven: getAccount("4120"),
      cogs: getAccount("5110"),
    };
  }
}
