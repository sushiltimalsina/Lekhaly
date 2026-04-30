import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";

@Injectable()
export class ItemsService {
  constructor(private prisma: PrismaService) { }

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

    const groupId = (input as any).groupId as string | undefined;
    if (groupId) {
      const group = await this.prisma.itemGroup.findFirst({ where: { id: groupId, companyId } });
      if (!group) throw new BadRequestException("Invalid group");
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
    const uomConversions = (input as any).uomConversions as Array<{ unit: string; factor: number; isBase?: boolean }> | undefined;
    const openingQty = (input as any).openingQty as number | undefined;
    const openingPrice = (input as any).openingPrice as number | undefined;

    const created = await this.prisma.item.create({
      data: {
        companyId: user.companyId,
        name: input.name,
        sku: input.sku,
        hsCode: (input as any).hsCode,
        groupId: (input as any).groupId,
        unit: input.unit,
        baseUnit: (input as any).baseUnit ?? input.unit ?? null,
        type: (input as any).type ?? "goods",
        salesPrice: input.salesPrice,
        purchasePrice: input.purchasePrice,
        reorderLevel: (input as any).reorderLevel ?? 0,
        safetyStock: (input as any).safetyStock ?? 0,
        incomeAccountId: (input as any).incomeAccountId,
        expenseAccountId: (input as any).expenseAccountId,
        taxCodeId: (input as any).taxCodeId,
        itemTaxCodes: Array.isArray(taxCodeIds) && taxCodeIds.length
          ? {
            create: taxCodeIds.map((id) => ({ taxCodeId: id }))
          }
          : undefined,
        uomConversions: Array.isArray(uomConversions) && uomConversions.length
          ? {
            create: uomConversions.map((c) => ({
              unit: c.unit,
              factor: new Prisma.Decimal(c.factor),
              isBase: Boolean(c.isBase)
            }))
          }
          : undefined
      }
    });

    if (openingQty && openingQty !== 0 && (created as any).type !== "services") {
      const qty = new Prisma.Decimal(openingQty);
      const rate = new Prisma.Decimal(openingPrice ?? 0);
      const amount = qty.abs().mul(rate);
      await this.prisma.stockLedger.create({
        data: {
          companyId: user.companyId,
          itemId: created.id,
          date: new Date(),
          dateBs: null,
          voucherId: null,
          qtyIn: qty.gt(0) ? qty : new Prisma.Decimal(0),
          qtyOut: qty.lt(0) ? qty.abs() : new Prisma.Decimal(0),
          rate,
          amount
        }
      });
    }

    return created;
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
    const uomConversions = (input as any).uomConversions as Array<{ unit: string; factor: number; isBase?: boolean }> | undefined;
    if (Array.isArray(taxCodeIds) || Array.isArray(uomConversions)) {
      return this.prisma.$transaction(async (tx) => {
        const updated = await tx.item.update({
          where: { id },
          data: input
        });
        if (Array.isArray(taxCodeIds)) {
          await tx.itemTaxCode.deleteMany({ where: { itemId: id } });
          if (taxCodeIds.length) {
            await tx.itemTaxCode.createMany({
              data: taxCodeIds.map((taxCodeId) => ({ itemId: id, taxCodeId }))
            });
          }
        }
        if (Array.isArray(uomConversions)) {
          await tx.itemUomConversion.deleteMany({ where: { itemId: id } });
          if (uomConversions.length) {
            await tx.itemUomConversion.createMany({
              data: uomConversions.map((c) => ({
                itemId: id,
                unit: c.unit,
                factor: new Prisma.Decimal(c.factor),
                isBase: Boolean(c.isBase)
              }))
            });
          }
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
    if (filters.q) {
      where.OR = [
        { name: { contains: filters.q, mode: "insensitive" } },
        { sku: { contains: filters.q, mode: "insensitive" } }
      ];
    }
    if ((filters as any).type) where.type = (filters as any).type;

    const items = await this.prisma.item.findMany({
      where,
      orderBy: { name: "asc" },
      skip: filters.skip || 0,
      take: filters.take || 1000
    });

    const ledger = await this.prisma.stockLedger.groupBy({
      by: ["itemId"],
      where: { companyId: user.companyId },
      _sum: {
        qtyIn: true,
        qtyOut: true
      }
    });

    const stockMap = new Map<string, number>();
    for (const group of ledger) {
      const inQty = Number(group._sum.qtyIn || 0);
      const outQty = Number(group._sum.qtyOut || 0);
      stockMap.set(group.itemId, inQty - outQty);
    }

    return items.map((item) => ({
      ...item,
      stock: item.type === "services" ? 0 : (stockMap.get(item.id) || 0)
    }));
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
