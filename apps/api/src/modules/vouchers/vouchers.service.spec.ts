import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { Prisma, VoucherStatus, VoucherType } from "@prisma/client";
import type { AuthUser } from "../../common/auth/auth.types";
import { VouchersService } from "./vouchers.service";

describe("VouchersService", () => {
  let service: VouchersService;
  let prisma: any;
  let inventory: any;
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
        findFirst: jest.fn(),
        update: jest.fn()
      },
      fiscalSession: {
        update: jest.fn()
      },
      inventorySettings: {
        findUnique: jest.fn(),
        create: jest.fn()
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
      voucherAttachment: {
        findMany: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        delete: jest.fn()
      },
      $transaction: jest.fn()
    };

    tx = {
      apiIdempotency: prisma.apiIdempotency,
      voucher: prisma.voucher,
      voucherLine: prisma.voucherLine,
      company: prisma.company,
      fiscalSession: prisma.fiscalSession,
      inventorySettings: prisma.inventorySettings,
      item: prisma.item
    };

    prisma.$transaction.mockImplementation((callback: (client: typeof tx) => any) => callback(tx));

    inventory = {
      consumeInventoryCost: jest.fn().mockResolvedValue({
        unitCost: new Prisma.Decimal(0),
        amount: new Prisma.Decimal(0),
        consumedQty: new Prisma.Decimal(0)
      }),
      receiveInventoryLayer: jest.fn()
    };

    service = new VouchersService(prisma, inventory);
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
      activeFiscalSessionId: "session-1",
      fiscalSessions: [
        {
          id: "session-1",
          isLocked: false,
          startDate: new Date("2020-01-01T00:00:00.000Z"),
          endDate: new Date("2030-12-31T00:00:00.000Z"),
          invoicePrefix: "INV",
          invoiceSuffix: "",
          nextInvoiceNumber: 10
        }
      ]
    });
    prisma.company.findFirst.mockResolvedValue({
      id: user.companyId,
      activeFiscalSessionId: "session-1"
    });
    prisma.fiscalSession.update.mockResolvedValue({ id: "session-1" });

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

  it("lists voucher attachments", async () => {
    prisma.voucher.findFirst.mockResolvedValue({ id: "voucher-1", companyId: user.companyId });
    prisma.voucherAttachment.findMany.mockResolvedValue([
      {
        id: "att-1",
        fileName: "invoice.pdf",
        uploadedByUser: { id: "user-1", email: "user@example.com", name: "User" }
      }
    ]);

    const result = await service.listAttachments(user, "voucher-1");

    expect(prisma.voucherAttachment.findMany).toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0].fileName).toBe("invoice.pdf");
  });

  it("prevents adding attachments to void vouchers", async () => {
    prisma.voucher.findFirst.mockResolvedValue({
      id: "voucher-3",
      companyId: user.companyId,
      status: VoucherStatus.void
    });

    await expect(
      service.addAttachment(user, "voucher-3", {
        fileName: "file.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1000,
        storageKey: "s3/key"
      })
    ).rejects.toThrow(ForbiddenException);
  });

  it("adds and removes attachments", async () => {
    prisma.voucher.findFirst.mockResolvedValue({
      id: "voucher-4",
      companyId: user.companyId,
      status: VoucherStatus.draft
    });
    prisma.voucherAttachment.create.mockResolvedValue({ id: "att-2" });

    const created = await service.addAttachment(user, "voucher-4", {
      fileName: "file.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1000,
      storageKey: "s3/key"
    });

    expect(created.id).toBe("att-2");

    prisma.voucherAttachment.findFirst.mockResolvedValue({
      id: "att-2",
      voucherId: "voucher-4",
      companyId: user.companyId
    });

    const removed = await service.removeAttachment(user, "voucher-4", "att-2");
    expect(removed).toEqual({ id: "att-2", deleted: true });
  });

  it("fails when attachment is missing", async () => {
    prisma.voucher.findFirst.mockResolvedValue({
      id: "voucher-5",
      companyId: user.companyId,
      status: VoucherStatus.draft
    });
    prisma.voucherAttachment.findFirst.mockResolvedValue(null);

    await expect(service.removeAttachment(user, "voucher-5", "missing")).rejects.toThrow(NotFoundException);
  });

  it("returns a signed url for attachments", async () => {
    prisma.voucher.findFirst.mockResolvedValue({
      id: "voucher-6",
      companyId: user.companyId,
      status: VoucherStatus.draft
    });
    prisma.voucherAttachment.findFirst.mockResolvedValue({
      id: "att-3",
      voucherId: "voucher-6",
      companyId: user.companyId,
      fileName: "scan.png",
      mimeType: "image/png",
      storageKey: "local/scan.png"
    });

    const result = await service.getAttachmentUrl(user, "voucher-6", "att-3");

    expect(result.attachmentId).toBe("att-3");
    expect(result.url).toContain("local/scan.png");
    expect(result.expiresAt).toBeInstanceOf(Date);
  });
});
