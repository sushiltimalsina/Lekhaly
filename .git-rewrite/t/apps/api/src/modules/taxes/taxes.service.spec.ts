import { Prisma } from "@prisma/client";
import type { AuthUser } from "../../common/auth/auth.types";
import { TaxesService } from "./taxes.service";

describe("TaxesService", () => {
  let service: TaxesService;
  let prisma: any;
  const user = { sub: "user-1", companyId: "company-1" } as AuthUser;

  beforeEach(() => {
    prisma = {
      taxCode: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
      voucherLine: { findMany: jest.fn() }
    };
    service = new TaxesService(prisma);
  });

  it("builds VAT summary", async () => {
    prisma.voucherLine.findMany.mockResolvedValue([
      {
        voucherId: "v-1",
        voucher: { voucherDate: new Date() },
        partyId: null,
        debit: new Prisma.Decimal(0),
        credit: new Prisma.Decimal(100),
        taxAmount: new Prisma.Decimal(13),
        taxCodeId: "tax-1"
      },
      {
        voucherId: "v-2",
        voucher: { voucherDate: new Date() },
        partyId: null,
        debit: new Prisma.Decimal(100),
        credit: new Prisma.Decimal(0),
        taxAmount: new Prisma.Decimal(10),
        taxCodeId: "tax-2"
      }
    ]);

    const summary = await service.vatSummary(user, undefined, undefined);
    expect(summary.totalSalesVat.toString()).toBe("13");
    expect(summary.totalPurchaseVat.toString()).toBe("10");
    expect(summary.netVat.toString()).toBe("3");
  });
});
