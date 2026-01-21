import type { AuthUser } from "../../common/auth/auth.types";
import { InventoryService } from "./inventory.service";
import { Prisma } from "@prisma/client";

describe("InventoryService", () => {
  let service: InventoryService;
  let prisma: any;
  const user = { sub: "user-1", companyId: "company-1" } as AuthUser;

  beforeEach(() => {
    prisma = {
      item: {
        findFirst: jest.fn()
      },
      chartOfAccount: {
        findFirst: jest.fn()
      },
      stockLedger: {
        findMany: jest.fn(),
        create: jest.fn()
      },
      voucher: {
        create: jest.fn()
      },
      $transaction: jest.fn()
    };
    prisma.$transaction.mockImplementation((cb: any) => cb(prisma));
    service = new InventoryService(prisma);
  });

  it("returns stock summary", async () => {
    prisma.item.findFirst.mockResolvedValue({ id: "item-1" });
    prisma.stockLedger.findMany.mockResolvedValue([
      { qtyIn: new Prisma.Decimal(10), qtyOut: new Prisma.Decimal(0) },
      { qtyIn: new Prisma.Decimal(0), qtyOut: new Prisma.Decimal(3) }
    ]);

    const result = await service.getStock(user, "item-1", {});
    expect(result.qty.toString()).toBe("7");
  });

  it("adjusts stock with a voucher", async () => {
    prisma.item.findFirst.mockResolvedValue({
      id: "item-1",
      expenseAccountId: "inv-acc"
    });
    prisma.chartOfAccount.findFirst.mockResolvedValue({ id: "offset-acc" });
    prisma.voucher.create.mockResolvedValue({ id: "v-1" });
    prisma.stockLedger.create.mockResolvedValue({ id: "s-1" });

    const result = await service.adjustStock(user, {
      itemId: "item-1",
      date: new Date(),
      qty: 5,
      rate: 10,
      accountId: "offset-acc"
    });

    expect(result.ok).toBe(true);
    expect(prisma.voucher.create).toHaveBeenCalled();
    expect(prisma.stockLedger.create).toHaveBeenCalled();
  });
});
