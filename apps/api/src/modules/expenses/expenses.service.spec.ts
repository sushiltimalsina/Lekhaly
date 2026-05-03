import type { AuthUser } from "../../common/auth/auth.types";
import { ExpensesService } from "./expenses.service";

describe("ExpensesService", () => {
  let service: ExpensesService;
  let prisma: any;
  const user = { sub: "user-1", companyId: "company-1" } as AuthUser;

  beforeEach(() => {
    prisma = {
      party: { findFirst: jest.fn() },
      taxCode: { findFirst: jest.fn() },
      voucherAttachment: { findFirst: jest.fn() },
      chartOfAccount: { findFirst: jest.fn() },
      company: { findUnique: jest.fn() },
      expense: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn(), findMany: jest.fn() },
      voucher: { create: jest.fn() }
    };
    prisma.company.findUnique.mockResolvedValue({ id: user.companyId, lockDate: null });
    service = new ExpensesService(prisma);
  });

  it("creates a draft expense", async () => {
    prisma.chartOfAccount.findFirst.mockResolvedValue({ id: "acc-1" });
    prisma.expense.create.mockResolvedValue({ id: "exp-1" });

    const result = await service.createDraft(user, {
      date: new Date(),
      amount: 100,
      expenseAccountId: "acc-1",
      paymentAccountId: "acc-2"
    });

    expect(result.id).toBe("exp-1");
  });

  it("previews expense lines", async () => {
    prisma.chartOfAccount.findFirst.mockResolvedValue({ id: "acc-1" });
    const result = await service.preview(user, {
      date: new Date(),
      amount: 100,
      expenseAccountId: "acc-1",
      paymentAccountId: "acc-2"
    });
    expect(result.lines.length).toBeGreaterThan(0);
  });
});
