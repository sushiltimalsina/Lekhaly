import { BadRequestException } from "@nestjs/common";
import { AccountsService } from "./accounts.service";

describe("AccountsService", () => {
  let service: AccountsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(),
      chartOfAccount: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        create: jest.fn()
      }
    };
    service = new AccountsService(prisma);
  });

  it("rejects duplicate account codes on creation", async () => {
    const tx = {
      $executeRaw: jest.fn(),
      chartOfAccount: {
        findUnique: jest.fn().mockResolvedValue({ id: "existing-account" }),
        findFirst: jest.fn(),
        create: jest.fn()
      }
    };
    prisma.$transaction.mockImplementation(async (cb) => cb(tx));

    await expect(
      service.create({ companyId: "company-1" } as any, {
        companyId: "company-1",
        code: "1000",
        name: "Cash",
        type: "asset",
        isGroup: false,
        isActive: true
      } as any)
    ).rejects.toThrow("Account code 1000 is already in use.");
  });

  it("rejects moving an account under one of its descendants", async () => {
    prisma.chartOfAccount.findFirst
      .mockResolvedValueOnce({ id: "child", companyId: "company-1", parentId: null, type: "asset", isGroup: false })
      .mockResolvedValueOnce({ id: "parent", companyId: "company-1", type: "asset", isGroup: true, parentId: "child", level: 0 });

    await expect(
      service.update({ companyId: "company-1" } as any, "child", {
        parentId: "parent",
        type: "asset",
        isGroup: false,
        isActive: true
      } as any)
    ).rejects.toThrow("Account cannot be moved under one of its descendants");
  });

  it("prevents removing a group that still has child accounts", async () => {
    prisma.chartOfAccount.findFirst.mockResolvedValue({
      id: "group-1",
      companyId: "company-1",
      _count: { children: 1, voucherLines: 0, incomeItems: 0, expenseItems: 0, inputTaxCodes: 0, outputTaxCodes: 0, bankAccounts: 0, invoices: 0, billSundries: 0, invoiceSundries: 0, quotationSundries: 0, salesOrderSundries: 0, purchaseOrderSundries: 0 }
    });

    await expect(service.remove({ companyId: "company-1" } as any, "group-1")).rejects.toThrow(
      "Remove or move child accounts before removing this group"
    );
  });

  it("deactivates referenced accounts and restores them when needed", async () => {
    prisma.chartOfAccount.findFirst.mockResolvedValue({
      id: "ledger-1",
      companyId: "company-1",
      _count: { children: 0, voucherLines: 2, incomeItems: 0, expenseItems: 0, inputTaxCodes: 0, outputTaxCodes: 0, bankAccounts: 0, invoices: 0, billSundries: 0, invoiceSundries: 0, quotationSundries: 0, salesOrderSundries: 0, purchaseOrderSundries: 0 }
    });

    await service.remove({ companyId: "company-1" } as any, "ledger-1");
    expect(prisma.chartOfAccount.update).toHaveBeenCalledWith({
      where: { id: "ledger-1" },
      data: { isActive: false }
    });

    prisma.chartOfAccount.findFirst.mockResolvedValue({ id: "ledger-1", companyId: "company-1" });
    await service.restore({ companyId: "company-1" } as any, "ledger-1");
    expect(prisma.chartOfAccount.update).toHaveBeenLastCalledWith({
      where: { id: "ledger-1" },
      data: { isActive: true }
    });
  });
});
