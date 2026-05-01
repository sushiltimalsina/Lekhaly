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
    const sku = typeof input.sku === "string" ? input.sku.trim() : undefined;
    if (sku) {
      const existingSku = await this.prisma.item.findFirst({
        where: {
          companyId: user.companyId,
          sku: { equals: sku, mode: "insensitive" }
        }
      });
      if (existingSku) throw new BadRequestException("SKU/Unique ID already exists");
    }
    await this.validateRefs(user.companyId, input);
    const taxCodeIds = (input as any).taxCodeIds as string[] | undefined;
    const uomConversions = (input as any).uomConversions as Array<{ unit: string; factor: number; isBase?: boolean }> | undefined;
    const openingQty = (input as any).openingQty as number | undefined;
    const openingPrice = (input as any).openingPrice as number | undefined;

    const created = await this.prisma.item.create({
      data: {
        companyId: user.companyId,
        name: input.name,
        sku,
        hsCode: (input as any).hsCode,
        groupId: (input as any).groupId,
        unit: input.unit,
        baseUnit: (input as any).baseUnit ?? input.unit ?? null,
        type: (input as any).type ?? "goods",
        salesPrice: input.salesPrice,
        purchasePrice: input.purchasePrice,
        reorderLevel: (input as any).reorderLevel ?? 0,
        safetyStock: (input as any).safetyStock ?? 0,
        minStockLevel: (input as any).minStockLevel ?? null,
        reorderQty: (input as any).reorderQty ?? null,
        isSerialized: (input as any).isSerialized ?? false,
        isKit: (input as any).isKit ?? false,
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

    // Handle Bill of Materials (Kit components)
    const components = (input as any).components as Array<{ componentId: string; qty: number }> | undefined;
    if (Array.isArray(components) && components.length) {
      await this.prisma.itemComponent.createMany({
        data: components.map((c) => ({
          companyId: user.companyId,
          parentId: created.id,
          componentId: c.componentId,
          qty: new Prisma.Decimal(c.qty)
        }))
      });
    }

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
    if (typeof input.sku === "string") {
      const nextSku = input.sku.trim();
      if (nextSku) {
        const existing = await this.prisma.item.findFirst({
          where: {
            companyId: user.companyId,
            sku: { equals: nextSku, mode: "insensitive" },
            NOT: { id }
          }
        });
        if (existing) throw new BadRequestException("SKU/Unique ID already exists");
        (input as any).sku = nextSku;
      } else {
        (input as any).sku = null;
      }
    }
    await this.validateRefs(user.companyId, input);

    // Handle components update
    const components = (input as any).components as Array<{ componentId: string; qty: number }> | undefined;
    if (Array.isArray(components)) {
      await this.prisma.itemComponent.deleteMany({ where: { parentId: id } });
      if (components.length) {
        await this.prisma.itemComponent.createMany({
          data: components.map((c) => ({
            companyId: user.companyId,
            parentId: id,
            componentId: c.componentId,
            qty: new Prisma.Decimal(c.qty)
          }))
        });
      }
    }

    const taxCodeIds = (input as any).taxCodeIds as string[] | undefined;
    const uomConversions = (input as any).uomConversions as Array<{ unit: string; factor: number; isBase?: boolean }> | undefined;

    if (Array.isArray(taxCodeIds) || Array.isArray(uomConversions)) {
      return this.prisma.$transaction(async (tx) => {
        const updateData: any = { ...input };
        delete updateData.taxCodeIds;
        delete updateData.uomConversions;
        delete updateData.components;
        const updated = await tx.item.update({
          where: { id },
          data: updateData
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

    const updateData: any = { ...input };
    delete updateData.components;
    return this.prisma.item.update({
      where: { id },
      data: updateData
    });
  }

  async get(user: AuthUser, id: string) {
    const item = await this.prisma.item.findFirst({
      where: { id, companyId: user.companyId },
      include: {
        components: {
          include: { component: { select: { id: true, name: true, sku: true, unit: true } } }
        },
        itemTaxCodes: { include: { taxCode: true } },
        uomConversions: true,
      }
    });
    if (!item) throw new NotFoundException("Item not found");
    // Attach current stock
    const ledger = await this.prisma.stockLedger.aggregate({
      where: { companyId: user.companyId, itemId: id },
      _sum: { qtyIn: true, qtyOut: true }
    });
    const stock = (Number(ledger._sum.qtyIn || 0)) - (Number(ledger._sum.qtyOut || 0));
    const minStock = item.minStockLevel ? Number(item.minStockLevel) : null;
    return { ...item, stock, isLowStock: minStock !== null && stock < minStock };
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

    return items.map((item) => {
      const stock = item.type === "services" ? 0 : (stockMap.get(item.id) || 0);
      const minStock = (item as any).minStockLevel ? Number((item as any).minStockLevel) : null;
      return {
        ...item,
        stock,
        isLowStock: minStock !== null && stock < minStock
      };
    });
  }

  /** Assemble: consume components, create finished-goods stock entry */
  async assemble(user: AuthUser, parentId: string, qty: number, memo?: string) {
    const item = await this.prisma.item.findFirst({
      where: { id: parentId, companyId: user.companyId, isKit: true },
      include: { components: true }
    });
    if (!item) throw new NotFoundException("Kit item not found");
    if (!item.components.length) throw new BadRequestException("Kit has no components defined");

    return this.prisma.$transaction(async (tx) => {
      let totalKitCost = 0;

      // Deduct components
      for (const comp of item.components) {
        const compQty = Number(comp.qty) * qty;

        // Calculate average cost of component
        const compLedger = await tx.stockLedger.groupBy({
          by: ["itemId"],
          where: { companyId: user.companyId, itemId: comp.componentId },
          _sum: { qtyIn: true, qtyOut: true }
        });
        
        // Let's do a simple raw query for sum of amount in vs amount out to get value
        // Since Prisma groupBy doesn't easily let us conditionally sum amount based on qtyIn/qtyOut,
        // we'll fetch all ledger entries for this component to compute cost.
        const allEntries = await tx.stockLedger.findMany({
          where: { companyId: user.companyId, itemId: comp.componentId },
          select: { qtyIn: true, qtyOut: true, amount: true }
        });
        
        let totalQty = 0;
        let totalValue = 0;
        for (const entry of allEntries) {
          const qIn = Number(entry.qtyIn || 0);
          const qOut = Number(entry.qtyOut || 0);
          const amt = Number(entry.amount || 0);
          if (qIn > 0) { totalQty += qIn; totalValue += amt; }
          if (qOut > 0) { totalQty -= qOut; totalValue -= amt; }
        }
        
        const avgCost = totalQty > 0 ? (totalValue / totalQty) : 0;
        const compAmount = compQty * avgCost;
        totalKitCost += compAmount;

        await tx.stockLedger.create({
          data: {
            companyId: user.companyId,
            itemId: comp.componentId,
            date: new Date(),
            qtyIn: 0,
            qtyOut: compQty,
            rate: avgCost,
            amount: compAmount
          }
        });
      }

      const kitRate = qty > 0 ? (totalKitCost / qty) : 0;

      // Add assembled quantity to parent stock
      await tx.stockLedger.create({
        data: {
          companyId: user.companyId,
          itemId: parentId,
          date: new Date(),
          qtyIn: qty,
          qtyOut: 0,
          rate: kitRate,
          amount: totalKitCost
        }
      });
    });
  }

  /** Disassemble: decrement finished goods, return components to stock */
  async disassemble(user: AuthUser, parentId: string, qty: number) {
    const item = await this.prisma.item.findFirst({
      where: { id: parentId, companyId: user.companyId, isKit: true },
      include: { components: true }
    });
    if (!item) throw new NotFoundException("Kit item not found");
    if (!item.components.length) throw new BadRequestException("Kit has no components defined");

    return this.prisma.$transaction(async (tx) => {
      // Calculate average cost of the Kit
      const allEntries = await tx.stockLedger.findMany({
        where: { companyId: user.companyId, itemId: parentId },
        select: { qtyIn: true, qtyOut: true, amount: true }
      });
      let totalKitQty = 0;
      let totalKitValue = 0;
      for (const entry of allEntries) {
        const qIn = Number(entry.qtyIn || 0);
        const qOut = Number(entry.qtyOut || 0);
        const amt = Number(entry.amount || 0);
        if (qIn > 0) { totalKitQty += qIn; totalKitValue += amt; }
        if (qOut > 0) { totalKitQty -= qOut; totalKitValue -= amt; }
      }
      
      const avgKitCost = totalKitQty > 0 ? (totalKitValue / totalKitQty) : 0;
      const totalDisassembledCost = avgKitCost * qty;

      // Deduct assembled item
      await tx.stockLedger.create({
        data: {
          companyId: user.companyId,
          itemId: parentId,
          date: new Date(),
          qtyIn: 0,
          qtyOut: qty,
          rate: avgKitCost,
          amount: totalDisassembledCost
        }
      });

      // To distribute cost back to components, we proportion it by component standard quantity.
      // But we can also just use the component's current average cost, or split the totalDisassembledCost
      // proportionally. Let's do a simple split by component definition quantity.
      const totalComponentUnits = item.components.reduce((sum, c) => sum + Number(c.qty), 0);

      // Return components to stock
      for (const comp of item.components) {
        const compQty = Number(comp.qty) * qty;
        
        // Proportion the kit's cost to this component based on relative quantity
        // (A more advanced system would use relative standard costs)
        const costFraction = totalComponentUnits > 0 ? (Number(comp.qty) / totalComponentUnits) : 0;
        const compAmount = totalDisassembledCost * costFraction;
        const compRate = compQty > 0 ? (compAmount / compQty) : 0;

        await tx.stockLedger.create({
          data: {
            companyId: user.companyId,
            itemId: comp.componentId,
            date: new Date(),
            qtyIn: compQty,
            qtyOut: 0,
            rate: compRate,
            amount: compAmount
          }
        });
      }
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
