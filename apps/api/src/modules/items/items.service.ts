import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ItemType, Prisma, VoucherStatus, VoucherType } from "@prisma/client";
import type { AuthUser } from "../../common/auth/auth.types";
import { PrismaService } from "../../common/prisma/prisma.service";
import { InventoryService } from "../inventory/inventory.service";

type ItemInput = {
  name?: string;
  sku?: string;
  hsCode?: string;
  unit?: string;
  baseUnit?: string;
  uomConversions?: Array<{ unit: string; factor: number; isBase?: boolean }>;
  type?: "goods" | "services";
  salesPrice?: number;
  purchasePrice?: number;
  reorderLevel?: number;
  safetyStock?: number;
  openingQty?: number;
  openingPrice?: number;
  groupId?: string;
  incomeAccountId?: string;
  expenseAccountId?: string;
  taxCodeId?: string;
  taxCodeIds?: string[];
  minStockLevel?: number;
  reorderQty?: number;
  trackInventory?: boolean;
  isSerialized?: boolean;
  isKit?: boolean;
  tracksBatch?: boolean;
  tracksLot?: boolean;
  tracksExpiry?: boolean;
  components?: Array<{ componentId: string; qty: number }>;
  isActive?: boolean;
};

const itemInclude = {
  group: true,
  incomeAccount: true,
  expenseAccount: true,
  taxCode: true,
  itemTaxCodes: { include: { taxCode: true } },
  uomConversions: true,
  components: { include: { component: true } }
} satisfies Prisma.ItemInclude;

@Injectable()
export class ItemsService {
  constructor(
    private prisma: PrismaService,
    private inventory: InventoryService
  ) {}

  async create(user: AuthUser, input: ItemInput) {
    const name = input.name?.trim();
    if (!name) throw new BadRequestException("Item name is required");

    await this.ensureUniqueName(user.companyId, name);
    await this.validateRelations(user.companyId, input);

    const type = input.type ?? "goods";
    const taxCodeIds = this.taxCodeIds(input);
    const openingQty = new Prisma.Decimal(type === "goods" ? input.openingQty ?? 0 : 0);
    const openingRate = new Prisma.Decimal(input.openingPrice ?? input.purchasePrice ?? 0);
    const inventoryPolicy = await this.resolveInventoryPolicy(user.companyId, input, type);

    return this.prisma.$transaction(async (tx) => {
      const item = await tx.item.create({
        data: {
          companyId: user.companyId,
          name,
          sku: this.clean(input.sku),
          hsCode: this.clean(input.hsCode),
          unit: this.clean(input.unit),
          baseUnit: this.clean(input.baseUnit ?? input.unit),
          type: type as ItemType,
          salesPrice: this.decimalOrNull(input.salesPrice),
          purchasePrice: this.decimalOrNull(input.purchasePrice),
          reorderLevel: this.decimalOrZero(input.reorderLevel),
          safetyStock: this.decimalOrZero(input.safetyStock),
          groupId: input.groupId ?? null,
          incomeAccountId: input.incomeAccountId ?? null,
          expenseAccountId: input.expenseAccountId ?? null,
          taxCodeId: input.taxCodeId ?? taxCodeIds[0] ?? null,
          minStockLevel: this.decimalOrNull(input.minStockLevel),
          reorderQty: this.decimalOrNull(input.reorderQty),
          trackInventory: inventoryPolicy.trackInventory,
          isSerialized: inventoryPolicy.isSerialized,
          isKit: inventoryPolicy.isKit,
          tracksBatch: inventoryPolicy.tracksBatch,
          tracksLot: inventoryPolicy.tracksLot,
          tracksExpiry: inventoryPolicy.tracksExpiry,
          itemTaxCodes: taxCodeIds.length
            ? { create: taxCodeIds.map((taxCodeId) => ({ taxCodeId })) }
            : undefined,
          uomConversions: input.uomConversions?.length
            ? { create: this.normalizeUomConversions(input) }
            : undefined,
          components: input.components?.length
            ? { create: input.components.map((c) => ({ companyId: user.companyId, componentId: c.componentId, qty: new Prisma.Decimal(c.qty) })) }
            : undefined
        },
        include: itemInclude
      });

      if (openingQty.gt(0)) {
        const ledger = await tx.stockLedger.create({
          data: {
            companyId: user.companyId,
            itemId: item.id,
            date: new Date(),
            voucherId: null,
            qtyIn: openingQty,
            qtyOut: new Prisma.Decimal(0),
            rate: openingRate,
            amount: openingQty.mul(openingRate)
          }
        });
        await this.inventory.receiveInventoryLayer(tx, {
          companyId: user.companyId,
          itemId: item.id,
          qty: openingQty,
          unitCost: openingRate,
          date: ledger.date,
          sourceLedgerId: ledger.id,
          sourceVoucherId: null,
          sourceType: "opening"
        });
      }

      return item;
    });
  }

  async update(user: AuthUser, id: string, input: ItemInput) {
    const item = await this.findOwned(user.companyId, id);
    if (input.name?.trim() && input.name.trim() !== item.name) {
      await this.ensureUniqueName(user.companyId, input.name.trim(), id);
    }
    await this.validateRelations(user.companyId, input, id);
    const inventoryPolicy = await this.resolveInventoryPolicy(user.companyId, input, input.type ?? (item as any).type, item);

    const taxCodeIds = input.taxCodeIds || input.taxCodeId !== undefined ? this.taxCodeIds(input) : null;

    return this.prisma.$transaction(async (tx) => {
      if (taxCodeIds) {
        await tx.itemTaxCode.deleteMany({ where: { itemId: id } });
        if (taxCodeIds.length) {
          await tx.itemTaxCode.createMany({
            data: taxCodeIds.map((taxCodeId) => ({ itemId: id, taxCodeId })),
            skipDuplicates: true
          });
        }
      }

      if (input.uomConversions) {
        await tx.itemUomConversion.deleteMany({ where: { itemId: id } });
        if (input.uomConversions.length) {
          await tx.itemUomConversion.createMany({
            data: this.normalizeUomConversions(input).map((u) => ({ ...u, itemId: id })),
            skipDuplicates: true
          });
        }
      }

      if (input.components) {
        await tx.itemComponent.deleteMany({ where: { parentId: id } });
        if (input.components.length) {
          await tx.itemComponent.createMany({
            data: input.components.map((c) => ({
              companyId: user.companyId,
              parentId: id,
              componentId: c.componentId,
              qty: new Prisma.Decimal(c.qty)
            }))
          });
        }
      }

      return tx.item.update({
        where: { id },
        data: this.updateData(input, taxCodeIds, inventoryPolicy),
        include: itemInclude
      });
    });
  }

  async get(user: AuthUser, id: string) {
    const item = await this.prisma.item.findFirst({
      where: { id, companyId: user.companyId },
      include: itemInclude
    });
    if (!item) throw new NotFoundException("Item not found");
    return item;
  }

  async list(user: AuthUser, filters: { isActive?: boolean; q?: string; type?: "goods" | "services"; skip?: number; take?: number }) {
    const where: Prisma.ItemWhereInput = { companyId: user.companyId };
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.type) where.type = filters.type as ItemType;
    if (filters.q) {
      where.OR = [
        { name: { contains: filters.q, mode: "insensitive" } },
        { sku: { contains: filters.q, mode: "insensitive" } },
        { hsCode: { contains: filters.q, mode: "insensitive" } }
      ];
    }

    return this.prisma.item.findMany({
      where,
      include: itemInclude,
      orderBy: { name: "asc" },
      skip: filters.skip ?? 0,
      take: filters.take ?? 200
    });
  }

  async remove(user: AuthUser, id: string) {
    await this.findOwned(user.companyId, id);
    return this.prisma.item.update({ where: { id }, data: { isActive: false } });
  }

  async restore(user: AuthUser, id: string) {
    await this.findOwned(user.companyId, id);
    return this.prisma.item.update({ where: { id }, data: { isActive: true } });
  }

  async assemble(
    user: AuthUser,
    id: string,
    qty: number,
    memo?: string,
    components?: Array<{ componentId: string; consumedQty: number }>,
    sundries?: Array<{ sundryId: string; amount: number }>
  ) {
    const kit = await this.getKit(user.companyId, id);
    const quantity = new Prisma.Decimal(qty);
    if (quantity.lte(0)) throw new BadRequestException("Quantity must be positive");
    const componentRows = components?.length
      ? components.map((c) => ({ componentId: c.componentId, qty: new Prisma.Decimal(c.consumedQty) }))
      : kit.components.map((c) => ({ componentId: c.componentId, qty: c.qty.mul(quantity) }));

    return this.prisma.$transaction(async (tx) => {
      const settings = await this.inventory.getOrCreateSettings(user.companyId, tx);
      const voucher = await tx.voucher.create({
        data: {
          companyId: user.companyId,
          voucherType: VoucherType.journal,
          status: VoucherStatus.posted,
          voucherDate: new Date(),
          memo: memo || `Assembly: ${kit.name}`,
          postedAt: new Date(),
          postedByUserId: user.sub
        }
      });

      let finishedCost = new Prisma.Decimal(0);
      for (const c of componentRows) {
        const componentCost = await this.inventory.consumeInventoryCost(tx, {
          companyId: user.companyId,
          itemId: c.componentId,
          qty: c.qty,
          costingMethod: settings.costingMethod,
          allowNegative: settings.allowNegativeStock
        });
        finishedCost = finishedCost.add(componentCost.amount);
        await tx.stockLedger.create({
          data: {
            companyId: user.companyId,
            itemId: c.componentId,
            date: new Date(),
            voucherId: voucher.id,
            qtyIn: new Prisma.Decimal(0),
            qtyOut: c.qty,
            rate: componentCost.unitCost,
            amount: componentCost.amount
          }
        });
      }

      const rate = quantity.gt(0) ? finishedCost.div(quantity) : new Prisma.Decimal(0);
      const ledger = await tx.stockLedger.create({
        data: {
          companyId: user.companyId,
          itemId: kit.id,
          date: new Date(),
          voucherId: voucher.id,
          qtyIn: quantity,
          qtyOut: new Prisma.Decimal(0),
          rate,
          amount: quantity.mul(rate)
        }
      });
      await this.inventory.receiveInventoryLayer(tx, {
        companyId: user.companyId,
        itemId: kit.id,
        qty: quantity,
        unitCost: rate,
        date: ledger.date,
        sourceLedgerId: ledger.id,
        sourceVoucherId: voucher.id,
        sourceType: "assembly"
      });

      return { ok: true, voucherId: voucher.id, sundries: sundries ?? [] };
    });
  }

  async disassemble(
    user: AuthUser,
    id: string,
    qty: number,
    components?: Array<{ componentId: string; consumedQty: number }>,
    sundries?: Array<{ sundryId: string; amount: number }>
  ) {
    const kit = await this.getKit(user.companyId, id);
    const quantity = new Prisma.Decimal(qty);
    if (quantity.lte(0)) throw new BadRequestException("Quantity must be positive");
    const componentRows = components?.length
      ? components.map((c) => ({ componentId: c.componentId, qty: new Prisma.Decimal(c.consumedQty) }))
      : kit.components.map((c) => ({ componentId: c.componentId, qty: c.qty.mul(quantity) }));

    return this.prisma.$transaction(async (tx) => {
      const settings = await this.inventory.getOrCreateSettings(user.companyId, tx);
      const voucher = await tx.voucher.create({
        data: {
          companyId: user.companyId,
          voucherType: VoucherType.journal,
          status: VoucherStatus.posted,
          voucherDate: new Date(),
          memo: `Disassembly: ${kit.name}`,
          postedAt: new Date(),
          postedByUserId: user.sub
        }
      });

      const kitCost = await this.inventory.consumeInventoryCost(tx, {
        companyId: user.companyId,
        itemId: kit.id,
        qty: quantity,
        costingMethod: settings.costingMethod,
        allowNegative: settings.allowNegativeStock
      });
      await tx.stockLedger.create({
        data: {
          companyId: user.companyId,
          itemId: kit.id,
          date: new Date(),
          voucherId: voucher.id,
          qtyIn: new Prisma.Decimal(0),
          qtyOut: quantity,
          rate: kitCost.unitCost,
          amount: kitCost.amount
        }
      });

      const totalComponentQty = componentRows.reduce((sum, row) => sum.add(row.qty), new Prisma.Decimal(0));
      for (const c of componentRows) {
        const allocatedAmount = totalComponentQty.gt(0) ? kitCost.amount.mul(c.qty).div(totalComponentQty) : new Prisma.Decimal(0);
        const componentRate = c.qty.gt(0) ? allocatedAmount.div(c.qty) : new Prisma.Decimal(0);
        const ledger = await tx.stockLedger.create({
          data: {
            companyId: user.companyId,
            itemId: c.componentId,
            date: new Date(),
            voucherId: voucher.id,
            qtyIn: c.qty,
            qtyOut: new Prisma.Decimal(0),
            rate: componentRate,
            amount: allocatedAmount
          }
        });
        await this.inventory.receiveInventoryLayer(tx, {
          companyId: user.companyId,
          itemId: c.componentId,
          qty: c.qty,
          unitCost: componentRate,
          date: ledger.date,
          sourceLedgerId: ledger.id,
          sourceVoucherId: voucher.id,
          sourceType: "disassembly"
        });
      }

      return { ok: true, voucherId: voucher.id, sundries: sundries ?? [] };
    });
  }

  private async findOwned(companyId: string, id: string) {
    const item = await this.prisma.item.findFirst({ where: { id, companyId } });
    if (!item) throw new NotFoundException("Item not found");
    return item;
  }

  private async getInventorySettings(companyId: string) {
    const db = this.prisma as any;
    const existing = await db.inventorySettings.findUnique({ where: { companyId } });
    if (existing) return existing;
    return db.inventorySettings.create({ data: { companyId } });
  }

  private async resolveInventoryPolicy(companyId: string, input: ItemInput, type: string, existing?: any) {
    const settings = await this.getInventorySettings(companyId);
    const next = {
      trackInventory:
        type === "goods" && settings.inventoryTrackingEnabled
          ? input.trackInventory ?? existing?.trackInventory ?? true
          : false,
      isSerialized: input.isSerialized ?? existing?.isSerialized ?? false,
      isKit: input.isKit ?? existing?.isKit ?? false,
      tracksBatch: input.tracksBatch ?? existing?.tracksBatch ?? false,
      tracksLot: input.tracksLot ?? existing?.tracksLot ?? false,
      tracksExpiry: input.tracksExpiry ?? existing?.tracksExpiry ?? false
    };

    if (type === "services") {
      if (next.isSerialized || next.isKit || next.tracksBatch || next.tracksLot || next.tracksExpiry) {
        throw new BadRequestException("Service items cannot use inventory tracking features");
      }
      return { ...next, trackInventory: false };
    }

    if (!next.trackInventory) {
      if (next.isSerialized || next.tracksBatch || next.tracksLot || next.tracksExpiry) {
        throw new BadRequestException("Enable item stock tracking before enabling serial, batch, lot, or expiry policy");
      }
      if (input.openingQty && input.openingQty > 0) {
        throw new BadRequestException("Opening stock requires item stock tracking");
      }
    }

    if (next.isSerialized && !settings.serialTrackingEnabled) {
      throw new BadRequestException("Enable serial tracking in inventory configuration before creating serialized items");
    }
    if (next.isKit && !settings.kitsEnabled) {
      throw new BadRequestException("Enable kits in inventory configuration before creating kit items");
    }
    if (next.tracksBatch && !settings.batchTrackingEnabled) {
      throw new BadRequestException("Enable batch tracking in inventory configuration before creating batch-tracked items");
    }
    if (next.tracksLot && !settings.lotTrackingEnabled) {
      throw new BadRequestException("Enable lot tracking in inventory configuration before creating lot-tracked items");
    }
    if (next.tracksExpiry && !settings.expiryTrackingEnabled) {
      throw new BadRequestException("Enable expiry tracking in inventory configuration before creating expiry-tracked items");
    }

    return next;
  }

  private async getKit(companyId: string, id: string) {
    const kit = await this.prisma.item.findFirst({
      where: { id, companyId },
      include: { components: true }
    });
    if (!kit) throw new NotFoundException("Item not found");
    if (!kit.isKit) throw new BadRequestException("Item is not a kit");
    return kit;
  }

  private async ensureUniqueName(companyId: string, name: string, excludeId?: string) {
    const existing = await this.prisma.item.findFirst({
      where: { companyId, name: { equals: name, mode: "insensitive" }, NOT: excludeId ? { id: excludeId } : undefined }
    });
    if (existing) throw new BadRequestException("Item already exists");
  }

  private async validateRelations(companyId: string, input: ItemInput, itemId?: string) {
    if (input.groupId && !(await this.prisma.itemGroup.findFirst({ where: { id: input.groupId, companyId } }))) {
      throw new BadRequestException("Invalid item group");
    }

    const accountIds = [input.incomeAccountId, input.expenseAccountId].filter(Boolean) as string[];
    if (accountIds.length) {
      const count = await this.prisma.chartOfAccount.count({ where: { id: { in: accountIds }, companyId } });
      if (count !== new Set(accountIds).size) throw new BadRequestException("Invalid account");
    }

    const taxCodeIds = this.taxCodeIds(input);
    if (taxCodeIds.length) {
      const count = await this.prisma.taxCode.count({ where: { id: { in: taxCodeIds }, companyId } });
      if (count !== taxCodeIds.length) throw new BadRequestException("Invalid tax code");
    }

    const componentIds = Array.from(new Set(input.components?.map((c) => c.componentId) ?? []));
    if (componentIds.length) {
      if (itemId && componentIds.includes(itemId)) throw new BadRequestException("Kit cannot include itself");
      const count = await this.prisma.item.count({ where: { id: { in: componentIds }, companyId } });
      if (count !== componentIds.length) throw new BadRequestException("Invalid kit component");
    }
  }

  private updateData(
    input: ItemInput,
    taxCodeIds: string[] | null,
    inventoryPolicy: {
      trackInventory: boolean;
      isSerialized: boolean;
      isKit: boolean;
      tracksBatch: boolean;
      tracksLot: boolean;
      tracksExpiry: boolean;
    }
  ): Prisma.ItemUpdateInput {
    return {
      name: input.name?.trim(),
      sku: input.sku !== undefined ? this.clean(input.sku) : undefined,
      hsCode: input.hsCode !== undefined ? this.clean(input.hsCode) : undefined,
      unit: input.unit !== undefined ? this.clean(input.unit) : undefined,
      baseUnit: input.baseUnit !== undefined ? this.clean(input.baseUnit) : undefined,
      type: input.type as ItemType | undefined,
      salesPrice: input.salesPrice !== undefined ? this.decimalOrNull(input.salesPrice) : undefined,
      purchasePrice: input.purchasePrice !== undefined ? this.decimalOrNull(input.purchasePrice) : undefined,
      reorderLevel: input.reorderLevel !== undefined ? this.decimalOrZero(input.reorderLevel) : undefined,
      safetyStock: input.safetyStock !== undefined ? this.decimalOrZero(input.safetyStock) : undefined,
      group: input.groupId !== undefined ? (input.groupId ? { connect: { id: input.groupId } } : { disconnect: true }) : undefined,
      incomeAccount: input.incomeAccountId !== undefined ? (input.incomeAccountId ? { connect: { id: input.incomeAccountId } } : { disconnect: true }) : undefined,
      expenseAccount: input.expenseAccountId !== undefined ? (input.expenseAccountId ? { connect: { id: input.expenseAccountId } } : { disconnect: true }) : undefined,
      taxCode: taxCodeIds ? (taxCodeIds[0] ? { connect: { id: taxCodeIds[0] } } : { disconnect: true }) : undefined,
      minStockLevel: input.minStockLevel !== undefined ? this.decimalOrNull(input.minStockLevel) : undefined,
      reorderQty: input.reorderQty !== undefined ? this.decimalOrNull(input.reorderQty) : undefined,
      trackInventory: inventoryPolicy.trackInventory,
      isSerialized: inventoryPolicy.isSerialized,
      isKit: inventoryPolicy.isKit,
      tracksBatch: inventoryPolicy.tracksBatch,
      tracksLot: inventoryPolicy.tracksLot,
      tracksExpiry: inventoryPolicy.tracksExpiry,
      isActive: input.isActive
    };
  }

  private taxCodeIds(input: ItemInput) {
    return Array.from(new Set([...(input.taxCodeIds ?? []), input.taxCodeId].filter(Boolean) as string[]));
  }

  private normalizeUomConversions(input: ItemInput) {
    return (input.uomConversions ?? []).map((u) => ({
      unit: u.unit.trim(),
      factor: new Prisma.Decimal(u.factor),
      isBase: u.isBase ?? u.unit === (input.baseUnit ?? input.unit)
    }));
  }

  private clean(value?: string) {
    const trimmed = value?.trim();
    return trimmed || null;
  }

  private decimalOrNull(value?: number) {
    return value === undefined || value === null ? null : new Prisma.Decimal(value);
  }

  private decimalOrZero(value?: number) {
    return new Prisma.Decimal(value ?? 0);
  }
}
