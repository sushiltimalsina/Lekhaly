import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";

@Injectable()
export class ItemsService {
  constructor(private prisma: PrismaService) {}

  private async validateRefs(companyId: string, input: Prisma.ItemCreateInput | Prisma.ItemUpdateInput) {
    const ids = [
      (input as any).incomeAccountId,
      (input as any).expenseAccountId
    ].filter(Boolean) as string[];

    if (ids.length) {
      const accounts = await this.prisma.chartOfAccount.findMany({
        where: { id: { in: ids }, companyId }
      });
      if (accounts.length !== ids.length) throw new BadRequestException("Invalid account");
    }

    const taxCodeId = (input as any).taxCodeId as string | undefined;
    const taxCodeIds = (input as any).taxCodeIds as string[] | undefined;
    const allTaxIds = [
      ...(taxCodeId ? [taxCodeId] : []),
      ...(Array.isArray(taxCodeIds) ? taxCodeIds : [])
    ];
    if (allTaxIds.length) {
      const tax = await this.prisma.taxCode.findMany({
        where: { id: { in: allTaxIds }, companyId }
      });
      if (tax.length !== new Set(allTaxIds).size) throw new BadRequestException("Invalid tax code");
    }
  }

  async create(user: AuthUser, input: Prisma.ItemCreateInput) {
    const existing = await this.prisma.item.findFirst({
      where: {
        companyId: user.companyId,
        name: { equals: input.name, mode: "insensitive" }
      }
    });
    if (existing) throw new BadRequestException("Item name already exists");
    await this.validateRefs(user.companyId, input);
    const taxCodeIds = (input as any).taxCodeIds as string[] | undefined;
    return this.prisma.item.create({
      data: {
        companyId: user.companyId,
        name: input.name,
        sku: input.sku,
        hsCode: (input as any).hsCode,
        unit: input.unit,
        type: (input as any).type ?? "goods",
        salesPrice: input.salesPrice,
        purchasePrice: input.purchasePrice,
        incomeAccountId: (input as any).incomeAccountId,
        expenseAccountId: (input as any).expenseAccountId,
        taxCodeId: (input as any).taxCodeId,
        itemTaxCodes: Array.isArray(taxCodeIds) && taxCodeIds.length
          ? {
              create: taxCodeIds.map((id) => ({ taxCodeId: id }))
            }
          : undefined
      }
    });
  }

  async update(user: AuthUser, id: string, input: Prisma.ItemUpdateInput) {
    const item = await this.prisma.item.findFirst({ where: { id, companyId: user.companyId } });
    if (!item) throw new NotFoundException("Item not found");
    if (input.name) {
      const existing = await this.prisma.item.findFirst({
        where: {
          companyId: user.companyId,
          name: { equals: String(input.name), mode: "insensitive" },
          NOT: { id }
        }
      });
      if (existing) throw new BadRequestException("Item name already exists");
    }
    await this.validateRefs(user.companyId, input);

    const taxCodeIds = (input as any).taxCodeIds as string[] | undefined;
    if (Array.isArray(taxCodeIds)) {
      return this.prisma.$transaction(async (tx) => {
        const updated = await tx.item.update({
          where: { id },
          data: input
        });
        await tx.itemTaxCode.deleteMany({ where: { itemId: id } });
        if (taxCodeIds.length) {
          await tx.itemTaxCode.createMany({
            data: taxCodeIds.map((taxCodeId) => ({ itemId: id, taxCodeId }))
          });
        }
        return updated;
      });
    }

    return this.prisma.item.update({
      where: { id },
      data: input
    });
  }

  async get(user: AuthUser, id: string) {
    const item = await this.prisma.item.findFirst({ where: { id, companyId: user.companyId } });
    if (!item) throw new NotFoundException("Item not found");
    return item;
  }

  async list(user: AuthUser, filters: { isActive?: boolean; q?: string; skip?: number; take?: number }) {
    const where: Prisma.ItemWhereInput = { companyId: user.companyId };
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.q) where.name = { contains: filters.q, mode: "insensitive" };
    if ((filters as any).type) where.type = (filters as any).type;

    return this.prisma.item.findMany({
      where,
      orderBy: { name: "asc" },
      skip: filters.skip || 0,
      take: filters.take || 50
    });
  }

  async remove(user: AuthUser, id: string) {
    const item = await this.prisma.item.findFirst({ where: { id, companyId: user.companyId } });
    if (!item) throw new NotFoundException("Item not found");

    const usage = await this.prisma.voucherLine.count({
      where: { companyId: user.companyId, itemId: id }
    });
    if (usage > 0) throw new BadRequestException("Item is referenced by vouchers");

    return this.prisma.item.update({
      where: { id },
      data: { isActive: false }
    });
  }

  async restore(user: AuthUser, id: string) {
    const item = await this.prisma.item.findFirst({ where: { id, companyId: user.companyId } });
    if (!item) throw new NotFoundException("Item not found");

    return this.prisma.item.update({
      where: { id },
      data: { isActive: true }
    });
  }
}
