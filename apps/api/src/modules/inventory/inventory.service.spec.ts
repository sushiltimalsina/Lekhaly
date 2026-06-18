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
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn()
      },
      stockLedger: {
        findMany: jest.fn(),
        aggregate: jest.fn(),
        create: jest.fn()
      },
      inventorySettings: {
        findUnique: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn()
      },
      warehouse: {
        findFirst: jest.fn()
      },
      warehouseBin: {
        findFirst: jest.fn()
      },
      serialNumber: {
        findMany: jest.fn(),
        createMany: jest.fn(),
        updateMany: jest.fn()
      },
      voucher: {
        create: jest.fn()
      },
      $transaction: jest.fn()
    };
    prisma.$transaction.mockImplementation((cb: any) => cb(prisma));
    prisma.inventorySettings.findUnique.mockResolvedValue({
      companyId: "company-1",
      inventoryTrackingEnabled: true,
      warehousesEnabled: false,
      binsEnabled: false,
      batchTrackingEnabled: false,
      lotTrackingEnabled: false,
      expiryTrackingEnabled: false,
      serialTrackingEnabled: false,
      kitsEnabled: false,
      allowNegativeStock: false,
      requireWarehouseOnMovements: false,
      defaultWarehouseId: null,
      costingMethod: "moving_average"
    });
    service = new InventoryService(prisma);
  });

  it("returns stock summary", async () => {
    prisma.item.findFirst.mockResolvedValue({ id: "item-1" });
    prisma.stockLedger.findMany
      .mockResolvedValueOnce([
        { qtyIn: new Prisma.Decimal(10), qtyOut: new Prisma.Decimal(0), rate: new Prisma.Decimal(10), amount: new Prisma.Decimal(100) },
        { qtyIn: new Prisma.Decimal(0), qtyOut: new Prisma.Decimal(3), rate: new Prisma.Decimal(10), amount: new Prisma.Decimal(30) }
      ])
      .mockResolvedValueOnce([]);

    const result = await service.getStock(user, "item-1", {});
    expect(result.qty.toString()).toBe("7");
  });

  it("adjusts stock with a voucher", async () => {
    prisma.item.findFirst.mockResolvedValue({
      id: "item-1",
      expenseAccountId: "inv-acc"
    });
    prisma.chartOfAccount.findFirst.mockImplementation(({ where }: any) => {
      if (where.id === "offset-acc") return Promise.resolve({ id: "offset-acc", isActive: true, isPostable: true });
      if (where.id === "inv-acc") return Promise.resolve({ id: "inv-acc" });
      return Promise.resolve(null);
    });
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

  it("creates inventory asset account when setup is missing", async () => {
    prisma.item.findFirst.mockResolvedValue({
      id: "item-1",
      expenseAccountId: null,
      incomeAccountId: null
    });
    prisma.chartOfAccount.findFirst.mockImplementation(({ where }: any) => {
      if (where.id === "offset-acc") return Promise.resolve({ id: "offset-acc", isActive: true, isPostable: true });
      if (where.OR?.some((entry: any) => entry.code === "1100")) return Promise.resolve({ id: "current-assets", level: 1 });
      return Promise.resolve(null);
    });
    prisma.chartOfAccount.create.mockResolvedValue({ id: "inventory-asset" });
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
    expect(prisma.chartOfAccount.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        code: "1130",
        name: "Inventory",
        type: "asset",
        isPostable: true
      })
    }));
  });
});
