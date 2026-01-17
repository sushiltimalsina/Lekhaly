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
    if (taxCodeId) {
      const tax = await this.prisma.taxCode.findFirst({ where: { id: taxCodeId, companyId } });
      if (!tax) throw new BadRequestException("Invalid tax code");
    }
  }

  async create(user: AuthUser, input: Prisma.ItemCreateInput) {
    await this.validateRefs(user.companyId, input);
    return this.prisma.item.create({
      data: {
        companyId: user.companyId,
        name: input.name,
        sku: input.sku,
        unit: input.unit,
        salesPrice: input.salesPrice,
        purchasePrice: input.purchasePrice,
        incomeAccountId: (input as any).incomeAccountId,
        expenseAccountId: (input as any).expenseAccountId,
        taxCodeId: (input as any).taxCodeId
      }
    });
  }

  async update(user: AuthUser, id: string, input: Prisma.ItemUpdateInput) {
    const item = await this.prisma.item.findFirst({ where: { id, companyId: user.companyId } });
    if (!item) throw new NotFoundException("Item not found");
    await this.validateRefs(user.companyId, input);

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

    return this.prisma.item.findMany({
      where,
      orderBy: { name: "asc" },
      skip: filters.skip || 0,
      take: filters.take || 50
    });
  }
}
