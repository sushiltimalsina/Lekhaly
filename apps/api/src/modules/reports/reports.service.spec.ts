import { Prisma } from "@prisma/client";
import { ReportsService } from "./reports.service";

describe("ReportsService export", () => {
  let service: ReportsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      voucherLine: {
        findMany: jest.fn(),
        aggregate: jest.fn()
      },
      company: {
        findUnique: jest.fn()
      }
    };
    prisma.company.findUnique.mockResolvedValue({ id: "company-1", fiscalYearStartMonth: 4 });
    prisma.voucherLine.aggregate.mockResolvedValue({
      _sum: {
        debit: new Prisma.Decimal(0),
        credit: new Prisma.Decimal(0)
      }
    });
    service = new ReportsService(prisma, { enqueue: jest.fn() } as any);
  });

  it("exports trial balance as CSV", async () => {
    prisma.voucherLine.findMany.mockResolvedValue([
      {
        accountId: "acc-1",
        debit: new Prisma.Decimal(100),
        credit: new Prisma.Decimal(0),
        account: { code: "1000", name: "Cash", type: "asset" }
      },
      {
        accountId: "acc-2",
        debit: new Prisma.Decimal(0),
        credit: new Prisma.Decimal(100),
        account: { code: "4000", name: "Sales", type: "income" }
      }
    ]);

    const result = await service.exportPdf("company-1", {
      report: "trial-balance",
      format: "csv"
    });

    expect(result.format).toBe("csv");
    expect(result.contentType).toBe("text/csv");
    expect(result.fileName.endsWith(".csv")).toBe(true);

    const decoded = Buffer.from(result.contentBase64, "base64").toString("utf8");
    expect(decoded).toContain("accountCode,accountName,debit,credit");
    expect(decoded).toContain("1000,Cash,100.00,0.00");
    expect(decoded).toContain("4000,Sales,0.00,100.00");
  });

  it("exports profit and loss as CSV", async () => {
    prisma.voucherLine.findMany.mockResolvedValue([
      {
        accountId: "acc-3",
        debit: new Prisma.Decimal(0),
        credit: new Prisma.Decimal(200),
        account: { code: "4001", name: "Services", type: "income" }
      },
      {
        accountId: "acc-4",
        debit: new Prisma.Decimal(50),
        credit: new Prisma.Decimal(0),
        account: { code: "5000", name: "Rent", type: "expense" }
      }
    ]);

    const result = await service.exportPdf("company-1", {
      report: "profit-loss",
      format: "csv"
    });

    expect(result.format).toBe("csv");
    expect(result.contentType).toBe("text/csv");

    const decoded = Buffer.from(result.contentBase64, "base64").toString("utf8");
    expect(decoded).toContain("section,label,amount");
    expect(decoded).toContain("income,4001 Services,200.00");
    expect(decoded).toContain("expense,5000 Rent,50.00");
  });

  it("computes party aging buckets", async () => {
    const asOf = new Date("2026-01-31T00:00:00.000Z");
    prisma.voucherLine.findMany.mockResolvedValue([
      {
        partyId: "party-1",
        party: { id: "party-1", name: "Alpha" },
        voucher: { voucherDate: new Date("2026-01-15T00:00:00.000Z") },
        debit: new Prisma.Decimal(100),
        credit: new Prisma.Decimal(0)
      },
      {
        partyId: "party-1",
        party: { id: "party-1", name: "Alpha" },
        voucher: { voucherDate: new Date("2025-12-10T00:00:00.000Z") },
        debit: new Prisma.Decimal(0),
        credit: new Prisma.Decimal(50)
      },
      {
        partyId: "party-2",
        party: { id: "party-2", name: "Beta" },
        voucher: { voucherDate: new Date("2025-10-01T00:00:00.000Z") },
        debit: new Prisma.Decimal(200),
        credit: new Prisma.Decimal(0)
      }
    ]);

    const result = await service.partyAging("company-1", { asOf });

    expect(result.rows).toHaveLength(2);
    const alpha = result.rows.find((row) => row.partyId === "party-1");
    const beta = result.rows.find((row) => row.partyId === "party-2");
    expect(alpha?.buckets["0-30"].toString()).toBe("100");
    expect(alpha?.buckets["31-60"].toString()).toBe("-50");
    expect(beta?.buckets["91+"].toString()).toBe("200");
  });

  it("returns party ledger with running balance", async () => {
    prisma.voucherLine.findMany.mockResolvedValue([
      {
        partyId: "party-1",
        voucherId: "v-1",
        debit: new Prisma.Decimal(100),
        credit: new Prisma.Decimal(0),
        voucher: { voucherDate: new Date("2026-01-01"), voucherNumber: "INV-1" },
        account: { code: "1000", name: "Cash" }
      },
      {
        partyId: "party-1",
        voucherId: "v-2",
        debit: new Prisma.Decimal(0),
        credit: new Prisma.Decimal(40),
        voucher: { voucherDate: new Date("2026-01-02"), voucherNumber: "RCPT-1" },
        account: { code: "2000", name: "AR" }
      }
    ]);

    const result = await service.partyLedger("company-1", { partyId: "party-1" });
    expect(result.rows).toHaveLength(2);
    expect(result.balance.toString()).toBe("60");
  });
});
