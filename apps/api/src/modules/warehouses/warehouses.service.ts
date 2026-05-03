import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";

@Injectable()
export class WarehousesService {
  constructor(private prisma: PrismaService) {}

  // ─── Warehouse CRUD ────────────────────────────────────────

  async create(user: AuthUser, input: { name: string; code?: string }) {
    const existing = await this.prisma.warehouse.findFirst({
      where: {
        companyId: user.companyId,
        name: { equals: input.name, mode: "insensitive" },
      },
    });
    if (existing) throw new BadRequestException("Warehouse name already exists");

    return this.prisma.warehouse.create({
      data: {
        companyId: user.companyId,
        name: input.name,
        code: input.code?.trim() || null,
      },
      include: { bins: true },
    });
  }

  async update(
    user: AuthUser,
    id: string,
    input: { name?: string; code?: string; isActive?: boolean }
  ) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!warehouse) throw new NotFoundException("Warehouse not found");

    if (input.name && input.name !== warehouse.name) {
      const dup = await this.prisma.warehouse.findFirst({
        where: {
          companyId: user.companyId,
          name: { equals: input.name, mode: "insensitive" },
          NOT: { id },
        },
      });
      if (dup) throw new BadRequestException("Warehouse name already exists");
    }

    const data: Prisma.WarehouseUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.code !== undefined) data.code = input.code?.trim() || null;
    if (input.isActive !== undefined) data.isActive = input.isActive;

    return this.prisma.warehouse.update({
      where: { id },
      data,
      include: { bins: true },
    });
  }

  async list(user: AuthUser, filters: { isActive?: boolean; q?: string }) {
    const where: Prisma.WarehouseWhereInput = { companyId: user.companyId };
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.q) {
      where.OR = [
        { name: { contains: filters.q, mode: "insensitive" } },
        { code: { contains: filters.q, mode: "insensitive" } },
      ];
    }

    const warehouses = await this.prisma.warehouse.findMany({
      where,
      orderBy: { name: "desc" },
      include: {
        bins: { where: { isActive: true }, orderBy: { name: "desc" } },
        _count: { select: { bins: true, stockLedger: true } },
      },
    });

    // Get stock value per warehouse
    const stockAgg = await this.prisma.stockLedger.groupBy({
      by: ["warehouseId"],
      where: { companyId: user.companyId, warehouseId: { not: null } },
      _sum: { qtyIn: true, qtyOut: true, amount: true },
    });

    const stockMap = new Map<
      string,
      { totalQty: number; totalValue: number }
    >();
    for (const row of stockAgg) {
      if (!row.warehouseId) continue;
      const inQty = Number(row._sum.qtyIn ?? 0);
      const outQty = Number(row._sum.qtyOut ?? 0);
      stockMap.set(row.warehouseId, {
        totalQty: inQty - outQty,
        totalValue: Number(row._sum.amount ?? 0),
      });
    }

    return warehouses.map((w) => {
      const stock = stockMap.get(w.id);
      return {
        ...w,
        totalStockQty: stock?.totalQty ?? 0,
        totalStockValue: stock?.totalValue ?? 0,
      };
    });
  }

  async get(user: AuthUser, id: string) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id, companyId: user.companyId },
      include: {
        bins: { orderBy: { name: "desc" } },
        _count: { select: { bins: true, stockLedger: true } },
      },
    });
    if (!warehouse) throw new NotFoundException("Warehouse not found");
    return warehouse;
  }

  async remove(user: AuthUser, id: string) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!warehouse) throw new NotFoundException("Warehouse not found");

    const usage = await this.prisma.stockLedger.count({
      where: { companyId: user.companyId, warehouseId: id },
    });
    if (usage > 0) {
      // Soft-delete only if referenced
      return this.prisma.warehouse.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return this.prisma.warehouse.delete({ where: { id } });
  }

  // ─── Bin CRUD ──────────────────────────────────────────────

  async createBin(
    user: AuthUser,
    warehouseId: string,
    input: { name: string; code?: string }
  ) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: warehouseId, companyId: user.companyId },
    });
    if (!warehouse) throw new NotFoundException("Warehouse not found");

    const existing = await this.prisma.warehouseBin.findFirst({
      where: {
        warehouseId,
        name: { equals: input.name, mode: "insensitive" },
      },
    });
    if (existing) throw new BadRequestException("Bin name already exists in this warehouse");

    return this.prisma.warehouseBin.create({
      data: {
        companyId: user.companyId,
        warehouseId,
        name: input.name,
        code: input.code?.trim() || null,
      },
    });
  }

  async updateBin(
    user: AuthUser,
    binId: string,
    input: { name?: string; code?: string; isActive?: boolean }
  ) {
    const bin = await this.prisma.warehouseBin.findFirst({
      where: { id: binId, companyId: user.companyId },
    });
    if (!bin) throw new NotFoundException("Bin not found");

    if (input.name && input.name !== bin.name) {
      const dup = await this.prisma.warehouseBin.findFirst({
        where: {
          warehouseId: bin.warehouseId,
          name: { equals: input.name, mode: "insensitive" },
          NOT: { id: binId },
        },
      });
      if (dup) throw new BadRequestException("Bin name already exists in this warehouse");
    }

    const data: Prisma.WarehouseBinUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.code !== undefined) data.code = input.code?.trim() || null;
    if (input.isActive !== undefined) data.isActive = input.isActive;

    return this.prisma.warehouseBin.update({ where: { id: binId }, data });
  }

  async listBins(user: AuthUser, warehouseId: string) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: warehouseId, companyId: user.companyId },
    });
    if (!warehouse) throw new NotFoundException("Warehouse not found");

    return this.prisma.warehouseBin.findMany({
      where: { warehouseId, companyId: user.companyId },
      orderBy: { name: "desc" },
    });
  }

  async removeBin(user: AuthUser, binId: string) {
    const bin = await this.prisma.warehouseBin.findFirst({
      where: { id: binId, companyId: user.companyId },
    });
    if (!bin) throw new NotFoundException("Bin not found");

    const usage = await this.prisma.stockLedger.count({
      where: { companyId: user.companyId, binId },
    });
    if (usage > 0) {
      return this.prisma.warehouseBin.update({
        where: { id: binId },
        data: { isActive: false },
      });
    }

    return this.prisma.warehouseBin.delete({ where: { id: binId } });
  }
}
