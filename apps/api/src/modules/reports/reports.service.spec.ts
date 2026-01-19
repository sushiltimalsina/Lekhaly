import { Prisma } from "@prisma/client";
import { ReportsService } from "./reports.service";

describe("ReportsService export", () => {
  let service: ReportsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      voucherLine: {
        findMany: jest.fn()
      }
    };
    service = new ReportsService(prisma);
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
});
