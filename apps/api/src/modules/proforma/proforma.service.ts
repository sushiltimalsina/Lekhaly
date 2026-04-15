import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Prisma, VoucherType, VoucherStatus } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";

@Injectable()
export class ProformaService {
  private readonly logger = new Logger(ProformaService.name);
  constructor(private prisma: PrismaService) {}

  /**
   * Create a proforma invoice for offline printing.
   * Assigns a device-specific local number (e.g. PRF-D1-003).
   */
  async create(user: AuthUser, dto: {
    deviceId: string;
    voucherType: string;
    payload: any;
    memo?: string;
  }) {
    // Verify device access
    const link = await this.prisma.deviceUserLink.findFirst({
      where: { deviceId: dto.deviceId, userId: user.sub }
    });
    if (!link) throw new ForbiddenException("Device not linked");

    const device = await this.prisma.device.findUnique({ where: { id: dto.deviceId } });
    if (!device || device.companyId !== user.companyId) throw new ForbiddenException("Device not found");

    if (!device.proformaPrefix) {
      throw new BadRequestException("Device has no proforma prefix. Re-register the device.");
    }

    // Atomically assign next proforma number
    const result = await this.prisma.$transaction(async (tx) => {
      const dev = await tx.device.findUniqueOrThrow({ where: { id: dto.deviceId } });
      const localNumber = `${dev.proformaPrefix}-${String(dev.proformaSequence).padStart(3, "0")}`;

      // Increment proforma sequence
      await tx.device.update({
        where: { id: dto.deviceId },
        data: { proformaSequence: dev.proformaSequence + 1 }
      });

      const proforma = await tx.proformaInvoice.create({
        data: {
          companyId: user.companyId,
          deviceId: dto.deviceId,
          localNumber,
          voucherType: dto.voucherType as VoucherType,
          payload: dto.payload as Prisma.InputJsonValue,
          memo: dto.memo || null,
        }
      });

      return proforma;
    });

    this.logger.log(`Proforma ${result.localNumber} created for device ${dto.deviceId}`);

    return {
      id: result.id,
      localNumber: result.localNumber,
      voucherType: result.voucherType,
      createdAt: result.createdAt,
    };
  }

  /**
   * Convert a proforma to a real posted voucher.
   * Atomically assigns the next sequential voucher number (IRD-compliant).
   */
  async convert(user: AuthUser, proformaId: string) {
    const proforma = await this.prisma.proformaInvoice.findUnique({
      where: { id: proformaId }
    });

    if (!proforma) throw new NotFoundException("Proforma not found");
    if (proforma.companyId !== user.companyId) throw new ForbiddenException("Not your proforma");
    if (proforma.convertedAt) throw new BadRequestException("Proforma already converted");

    const result = await this.prisma.$transaction(async (tx) => {
      const company = await tx.company.findUniqueOrThrow({
        where: { id: user.companyId }
      });

      // Determine sequence and prefix based on voucher type
      let sequence: number;
      let prefix: string;
      const seqUpdate: Record<string, number> = {};

      switch (proforma.voucherType) {
        case VoucherType.sales_invoice:
        case VoucherType.sales_return:
          sequence = company.nextInvoiceNumber;
          prefix = company.invoicePrefix;
          seqUpdate.nextInvoiceNumber = sequence + 1;
          break;
        case VoucherType.purchase:
        case VoucherType.purchase_return:
          sequence = company.nextPurchaseOrderNumber;
          prefix = company.purchaseOrderPrefix;
          seqUpdate.nextPurchaseOrderNumber = sequence + 1;
          break;
        default:
          sequence = company.nextInvoiceNumber;
          prefix = proforma.voucherType.replace("_", "-").toUpperCase();
          seqUpdate.nextInvoiceNumber = sequence + 1;
          break;
      }

      const voucherNumber = `${prefix}-${sequence}`;
      const payload = proforma.payload as any;

      // Create the real voucher from proforma payload
      const voucher = await tx.voucher.create({
        data: {
          companyId: user.companyId,
          voucherType: proforma.voucherType,
          status: VoucherStatus.posted,
          voucherNumber,
          voucherDate: payload.voucherDate ? new Date(payload.voucherDate) : new Date(),
          voucherDateBs: payload.voucherDateBs || null,
          partyId: payload.partyId || null,
          memo: proforma.memo || payload.memo || null,
          source: "desktop",
          createdByUserId: user.sub,
          postedByUserId: user.sub,
          postedAt: new Date(),
        }
      });

      // Create voucher lines
      if (payload.lines && payload.lines.length > 0) {
        await tx.voucherLine.createMany({
          data: payload.lines.map((line: any, idx: number) => ({
            voucherId: voucher.id,
            companyId: user.companyId,
            lineNo: idx + 1,
            accountId: line.accountId,
            partyId: line.partyId || null,
            itemId: line.itemId || null,
            description: line.description || null,
            debit: line.debit || 0,
            credit: line.credit || 0,
            taxCodeId: line.taxCodeId || null,
            taxAmount: line.taxAmount || null,
          }))
        });
      }

      // Update company sequence
      await tx.company.update({
        where: { id: company.id },
        data: seqUpdate
      });

      // Mark proforma as converted
      await tx.proformaInvoice.update({
        where: { id: proforma.id },
        data: {
          convertedAt: new Date(),
          voucherId: voucher.id,
        }
      });

      return { voucher, voucherNumber };
    });

    this.logger.log(`Proforma ${proforma.localNumber} → ${result.voucherNumber}`);

    return {
      proformaId: proforma.id,
      localNumber: proforma.localNumber,
      voucherId: result.voucher.id,
      voucherNumber: result.voucherNumber,
      convertedAt: new Date(),
    };
  }

  /** List proformas for the company (filtered by conversion status) */
  async list(user: AuthUser, query: { converted: string; take: number; skip: number }) {
    const where: any = { companyId: user.companyId };

    if (query.converted === "true") {
      where.convertedAt = { not: null };
    } else if (query.converted === "false") {
      where.convertedAt = null;
    }

    const [items, total] = await Promise.all([
      this.prisma.proformaInvoice.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: query.take,
        skip: query.skip,
        include: {
          device: { select: { label: true, platform: true } },
          voucher: { select: { id: true, voucherNumber: true, status: true } },
        }
      }),
      this.prisma.proformaInvoice.count({ where })
    ]);

    return { items, total };
  }

  /** Get a single proforma by ID */
  async getById(user: AuthUser, id: string) {
    const proforma = await this.prisma.proformaInvoice.findUnique({
      where: { id },
      include: {
        device: { select: { label: true, platform: true } },
        voucher: { select: { id: true, voucherNumber: true, status: true } },
      }
    });

    if (!proforma) throw new NotFoundException("Proforma not found");
    if (proforma.companyId !== user.companyId) throw new ForbiddenException("Not your proforma");

    return proforma;
  }

  /**
   * Batch convert: convert all unconverted proformas for a device.
   * Called during sync when desktop comes online.
   */
  async batchConvert(user: AuthUser, deviceId: string) {
    const link = await this.prisma.deviceUserLink.findFirst({
      where: { deviceId, userId: user.sub }
    });
    if (!link) throw new ForbiddenException("Device not linked");

    const unconverted = await this.prisma.proformaInvoice.findMany({
      where: {
        companyId: user.companyId,
        deviceId,
        convertedAt: null,
      },
      orderBy: { createdAt: "asc" }
    });

    const results = [];
    for (const proforma of unconverted) {
      const result = await this.convert(user, proforma.id);
      results.push(result);
    }

    this.logger.log(`Batch converted ${results.length} proformas for device ${deviceId}`);
    return { converted: results.length, results };
  }
}
