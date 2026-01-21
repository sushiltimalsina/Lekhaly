import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";

@Injectable()
export class TaxesService {
  constructor(private prisma: PrismaService) {}

  async list(user: AuthUser, filters: { isActive?: boolean; q?: string }) {
    const where: Prisma.TaxCodeWhereInput = { companyId: user.companyId };
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.q) where.name = { contains: filters.q, mode: "insensitive" };

    return this.prisma.taxCode.findMany({ where, orderBy: { name: "asc" } });
  }

  async get(user: AuthUser, id: string) {
    const tax = await this.prisma.taxCode.findFirst({ where: { id, companyId: user.companyId } });
    if (!tax) throw new NotFoundException("Tax code not found");
    return tax;
  }

  async create(user: AuthUser, input: any) {
    return this.prisma.taxCode.create({
      data: {
        companyId: user.companyId,
        name: input.name,
        rate: new Prisma.Decimal(input.rate),
        isInclusive: Boolean(input.isInclusive),
        inputTaxAccountId: input.inputTaxAccountId,
        outputTaxAccountId: input.outputTaxAccountId
      }
    });
  }

  async update(user: AuthUser, id: string, input: any) {
    const tax = await this.prisma.taxCode.findFirst({ where: { id, companyId: user.companyId } });
    if (!tax) throw new NotFoundException("Tax code not found");

    return this.prisma.taxCode.update({
      where: { id: tax.id },
      data: {
        name: input.name ?? tax.name,
        rate: input.rate !== undefined ? new Prisma.Decimal(input.rate) : tax.rate,
        isInclusive: input.isInclusive ?? tax.isInclusive,
        inputTaxAccountId: input.inputTaxAccountId ?? tax.inputTaxAccountId,
        outputTaxAccountId: input.outputTaxAccountId ?? tax.outputTaxAccountId
      }
    });
  }

  async remove(user: AuthUser, id: string) {
    const tax = await this.prisma.taxCode.findFirst({ where: { id, companyId: user.companyId } });
    if (!tax) throw new NotFoundException("Tax code not found");

    return this.prisma.taxCode.update({
      where: { id: tax.id },
      data: { isActive: false }
    });
  }

  async buildVatRegister(companyId: string, from?: Date, to?: Date) {
    const where: Prisma.VoucherLineWhereInput = {
      companyId,
      taxCodeId: { not: null },
      voucher: { status: "posted" }
    };
    if (from || to) {
      where.voucher = { status: "posted", voucherDate: {} };
      if (from) (where.voucher.voucherDate as Prisma.DateTimeFilter).gte = from;
      if (to) (where.voucher.voucherDate as Prisma.DateTimeFilter).lte = to;
    }

    const lines = await this.prisma.voucherLine.findMany({
      where,
      include: { voucher: true, party: true }
    });

    const rows = lines.map((line) => ({
      voucherId: line.voucherId,
      date: line.voucher.voucherDate,
      partyId: line.partyId || null,
      taxableAmount: line.debit.gt(0) ? line.debit : line.credit,
      vatAmount: line.taxAmount,
      type: line.credit.gt(0) ? "sales" : "purchase",
      taxCodeId: line.taxCodeId
    }));

    return rows;
  }

  async vatReport(user: AuthUser, from?: Date, to?: Date) {
    const rows = await this.buildVatRegister(user.companyId, from, to);
    return { rows };
  }

  async vatSummary(user: AuthUser, from?: Date, to?: Date) {
    const rows = await this.buildVatRegister(user.companyId, from, to);
    let totalSalesVat = new Prisma.Decimal(0);
    let totalPurchaseVat = new Prisma.Decimal(0);
    for (const row of rows) {
      if (row.type === "sales") totalSalesVat = totalSalesVat.add(row.vatAmount);
      if (row.type === "purchase") totalPurchaseVat = totalPurchaseVat.add(row.vatAmount);
    }
    return {
      totalSalesVat,
      totalPurchaseVat,
      netVat: totalSalesVat.sub(totalPurchaseVat)
    };
  }
}
