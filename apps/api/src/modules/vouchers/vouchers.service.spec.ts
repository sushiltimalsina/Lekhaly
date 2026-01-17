import { BadRequestException } from "@nestjs/common";
import { Prisma, VoucherStatus, VoucherType } from "@prisma/client";
import type { AuthUser } from "../../common/auth/auth.types";
import { VouchersService } from "./vouchers.service";

describe("VouchersService", () => {
  let service: VouchersService;
  let prisma: any;
  let tx: any;

  const user = { sub: "user-1", companyId: "company-1" } as AuthUser;

  beforeEach(() => {
    prisma = {
      apiIdempotency: {
        findUnique: jest.fn(),
        create: jest.fn()
      },
      voucher: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn()
      },
      voucherLine: {
        deleteMany: jest.fn(),
        createMany: jest.fn()
      },
      company: {
        findUnique: jest.fn(),
        update: jest.fn()
      },
      chartOfAccount: {
        findMany: jest.fn()
      },
      party: {
        findMany: jest.fn()
      },
      item: {
        findMany: jest.fn()
      },
      taxCode: {
        findMany: jest.fn()
      },
      $transaction: jest.fn()
    };

    tx = {
      apiIdempotency: prisma.apiIdempotency,
      voucher: prisma.voucher,
      voucherLine: prisma.voucherLine,
      company: prisma.company
    };

    prisma.$transaction.mockImplementation((callback: (client: typeof tx) => any) => callback(tx));

    service = new VouchersService(prisma);
  });

  it("requires a party for sales invoice drafts", async () => {
    await expect(
      service.createDraft(
        user,
        {
          voucherType: VoucherType.sales_invoice,
          voucherDate: new Date(),
          lines: [{ accountId: "acc-1", debit: 100 }]
        },
        undefined
      )
    ).rejects.toThrow(BadRequestException);
  });

  it("returns idempotent response for duplicate createDraft", async () => {
    const response = { id: "voucher-1", status: VoucherStatus.draft };
    prisma.apiIdempotency.findUnique.mockResolvedValue({
      responseJson: response,
      requestHash: null
    });

    const result = await service.createDraft(
      user,
      {
        voucherType: VoucherType.journal,
        voucherDate: new Date(),
        lines: [{ accountId: "acc-1", debit: 100 }]
      },
      "idem-1"
    );

    expect(result).toBe(response);
    expect(prisma.voucher.create).not.toHaveBeenCalled();
  });

  it("rejects posting an unbalanced voucher", async () => {
    prisma.voucher.findFirst.mockResolvedValue({
      id: "voucher-1",
      companyId: user.companyId,
      voucherType: VoucherType.journal,
      status: VoucherStatus.draft,
      partyId: null,
      voucherDate: new Date(),
      lines: [
        {
          lineNo: 1,
          accountId: "acc-1",
          debit: new Prisma.Decimal(100),
          credit: new Prisma.Decimal(0),
          taxCodeId: null,
          taxAmount: new Prisma.Decimal(0)
        },
        {
          lineNo: 2,
          accountId: "acc-2",
          debit: new Prisma.Decimal(0),
          credit: new Prisma.Decimal(90),
          taxCodeId: null,
          taxAmount: new Prisma.Decimal(0)
        }
      ]
    });

    await expect(service.post(user, "voucher-1")).rejects.toThrow(BadRequestException);
  });

  it("posts a sales invoice with tax lines", async () => {
    prisma.voucher.findFirst.mockResolvedValue({
      id: "voucher-2",
      companyId: user.companyId,
      voucherType: VoucherType.sales_invoice,
      status: VoucherStatus.draft,
      partyId: "party-1",
      voucherDate: new Date(),
      lines: [
        {
          lineNo: 1,
          accountId: "acc-receivable",
          debit: new Prisma.Decimal(113),
          credit: new Prisma.Decimal(0),
          taxCodeId: null,
          taxAmount: new Prisma.Decimal(0)
        },
        {
          lineNo: 2,
          accountId: "acc-revenue",
          debit: new Prisma.Decimal(0),
          credit: new Prisma.Decimal(100),
          taxCodeId: "tax-1",
          taxAmount: new Prisma.Decimal(13)
        }
      ]
    });

    prisma.taxCode.findMany.mockResolvedValue([
      {
        id: "tax-1",
        outputTaxAccountId: "acc-tax-output",
        inputTaxAccountId: null
      }
    ]);

    prisma.chartOfAccount.findMany.mockImplementation(({ where }: { where: { id: { in: string[] } } }) => {
      return where.id.in.map((id: string) => ({
        id,
        companyId: user.companyId,
        isActive: true,
        isPostable: true
      }));
    });

    prisma.party.findMany.mockResolvedValue([{ id: "party-1" }]);
    prisma.company.findUnique.mockResolvedValue({
      id: user.companyId,
      lockDate: null,
      invoicePrefix: "INV",
      nextInvoiceNumber: 10
    });

    prisma.voucher.update.mockResolvedValue({ id: "voucher-2" });
    prisma.voucher.findUnique.mockResolvedValue({
      id: "voucher-2",
      status: VoucherStatus.posted,
      lines: []
    });

    const result = await service.post(user, "voucher-2");

    expect(prisma.voucherLine.createMany).toHaveBeenCalled();
    const callArgs = prisma.voucherLine.createMany.mock.calls[0][0];
    expect(callArgs.data[0].accountId).toBe("acc-tax-output");
    expect(callArgs.data[0].credit.toString()).toBe("13");
    expect(result).toEqual({
      id: "voucher-2",
      status: VoucherStatus.posted,
      lines: []
    });
  });
});
