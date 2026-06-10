import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { InventoryService } from "./inventory.service";
import { CreateStockCountDto, UpdateStockCountDto } from "./dto/stock-count.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class StockCountsService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService
  ) {}

  async list(companyId: string, query?: any) {
    return this.prisma.stockCount.findMany({
      where: { companyId },
      include: {
        warehouse: true,
        createdByUser: { select: { id: true, name: true, email: true } },
        _count: { select: { lines: true } }
      },
      orderBy: { countDate: "desc" }
    });
  }

  async getById(companyId: string, id: string) {
    const count = await this.prisma.stockCount.findFirst({
      where: { id, companyId },
      include: {
        warehouse: true,
        lines: {
          include: {
            item: true,
            bin: true
          }
        }
      }
    });

    if (!count) throw new NotFoundException("Stock count not found");
    return count;
  }

  async create(companyId: string, userId: string, dto: CreateStockCountDto) {
    await this.assertCountPolicy(companyId, dto.lines, dto.warehouseId);

    // Determine system quantities for lines
    const linesWithSystemQty = await Promise.all(dto.lines.map(async (line) => {
      // Find current stock
      const stockAggr = await this.prisma.stockLedger.aggregate({
        where: {
          companyId,
          itemId: line.itemId,
          warehouseId: dto.warehouseId || null,
          binId: line.binId || null,
        },
        _sum: {
          qtyIn: true,
          qtyOut: true
        }
      });
      const systemQty = new Prisma.Decimal((stockAggr._sum.qtyIn?.toNumber() || 0) - (stockAggr._sum.qtyOut?.toNumber() || 0));

      let variance: Prisma.Decimal | null = null;
      if (line.countedQty !== undefined) {
        variance = new Prisma.Decimal(line.countedQty).minus(systemQty);
      }

      return {
        itemId: line.itemId,
        binId: line.binId,
        systemQty,
        countedQty: line.countedQty !== undefined ? new Prisma.Decimal(line.countedQty) : null,
        variance,
        batchNo: line.batchNo,
        lotNo: line.lotNo,
        note: line.note
      };
    }));

    return this.prisma.stockCount.create({
      data: {
        companyId,
        createdByUserId: userId,
        reference: dto.reference,
        warehouseId: dto.warehouseId,
        countDate: new Date(dto.countDate),
        countDateBs: dto.countDateBs,
        memo: dto.memo,
        lines: {
          create: linesWithSystemQty
        }
      },
      include: { lines: true }
    });
  }

  async update(companyId: string, id: string, dto: UpdateStockCountDto) {
    const existing = await this.getById(companyId, id);
    if (existing.status === "completed" || existing.status === "cancelled") {
      throw new BadRequestException(`Cannot update a ${existing.status} stock count`);
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.lines || dto.warehouseId !== undefined) {
        await this.assertCountPolicy(
          companyId,
          dto.lines ?? existing.lines.map((line) => ({
            itemId: line.itemId,
            binId: line.binId ?? undefined,
            batchNo: line.batchNo ?? undefined,
            lotNo: line.lotNo ?? undefined
          })),
          dto.warehouseId !== undefined ? dto.warehouseId : existing.warehouseId ?? undefined,
          tx
        );
      }

      // Update basic fields
      const updateData: any = {};
      if (dto.reference !== undefined) updateData.reference = dto.reference;
      if (dto.countDate !== undefined) updateData.countDate = new Date(dto.countDate);
      if (dto.countDateBs !== undefined) updateData.countDateBs = dto.countDateBs;
      if (dto.memo !== undefined) updateData.memo = dto.memo;
      if (dto.warehouseId !== undefined) updateData.warehouseId = dto.warehouseId;
      if (dto.status !== undefined) updateData.status = dto.status;

      if (Object.keys(updateData).length > 0) {
        await tx.stockCount.update({
          where: { id },
          data: updateData
        });
      }

      // Process lines if provided
      if (dto.lines) {
        // Delete lines not in the new list (if they don't have IDs)
        // For simplicity, we can just delete all and recreate, or upsert.
        // Doing upsert:
        const incomingLineIds = dto.lines.map(l => l.id).filter(Boolean) as string[];
        if (incomingLineIds.length > 0) {
          await tx.stockCountLine.deleteMany({
            where: {
              stockCountId: id,
              id: { notIn: incomingLineIds }
            }
          });
        } else {
          await tx.stockCountLine.deleteMany({ where: { stockCountId: id } });
        }

        for (const line of dto.lines) {
          // Recalculate systemQty if needed
          const stockAggr = await tx.stockLedger.aggregate({
            where: {
              companyId,
              itemId: line.itemId,
              warehouseId: dto.warehouseId || existing.warehouseId,
              binId: line.binId || null,
            },
            _sum: { qtyIn: true, qtyOut: true }
          });
          const systemQty = new Prisma.Decimal((stockAggr._sum.qtyIn?.toNumber() || 0) - (stockAggr._sum.qtyOut?.toNumber() || 0));

          let variance: Prisma.Decimal | null = null;
          if (line.countedQty !== undefined) {
            variance = new Prisma.Decimal(line.countedQty).minus(systemQty);
          }

          if (line.id) {
            await tx.stockCountLine.update({
              where: { id: line.id },
              data: {
                itemId: line.itemId,
                binId: line.binId,
                systemQty,
                countedQty: line.countedQty !== undefined ? new Prisma.Decimal(line.countedQty) : null,
                variance,
                batchNo: line.batchNo,
                lotNo: line.lotNo,
                note: line.note
              }
            });
          } else {
            await tx.stockCountLine.create({
              data: {
                stockCountId: id,
                itemId: line.itemId,
                binId: line.binId,
                systemQty,
                countedQty: line.countedQty !== undefined ? new Prisma.Decimal(line.countedQty) : null,
                variance,
                batchNo: line.batchNo,
                lotNo: line.lotNo,
                note: line.note
              }
            });
          }
        }
      }

      return tx.stockCount.findFirst({ where: { id }, include: { lines: true } });
    });
  }

  async complete(companyId: string, id: string, adjustmentAccountId: string) {
    const existing = await this.getById(companyId, id);
    const settings = await this.inventoryService.getOrCreateSettings(companyId);
    if (!settings.inventoryTrackingEnabled) throw new BadRequestException("Inventory tracking is disabled");
    if (existing.status !== "in_progress" && existing.status !== "draft") {
      throw new BadRequestException(`Cannot complete a ${existing.status} stock count`);
    }

    // Ensure all lines have countedQty
    const incompleteLines = existing.lines.filter(l => l.countedQty === null);
    if (incompleteLines.length > 0) {
      throw new BadRequestException("All lines must have a counted quantity before completion");
    }

    // We will generate a stock adjustment for variances
    return this.prisma.$transaction(async (tx) => {
      // Find lines with variance != 0
      const variances = existing.lines.filter(l => l.variance && !l.variance.equals(0));
      let adjustmentVoucherId: string | null = null;

      if (variances.length > 0) {
        // We will call the inventoryService to adjust stock. 
        // Note: InventoryService.adjustStock is currently not bulk. 
        // For physical counts, we usually want one voucher with multiple lines.
        // Let's create a Journal Voucher directly, similar to what InventoryService does.
        
        // Let's fetch item details to get average rate for missing rates, or we use the latest rate.
        // We can just rely on the inventoryService for each line to maintain simplicity, 
        // though it generates multiple vouchers. Let's create one voucher here.

        const voucher = await tx.voucher.create({
          data: {
            companyId,
            voucherType: "journal",
            status: "posted",
            voucherDate: new Date(),
            source: "stock_count",
            memo: `Physical Stock Count Adjustment - ${existing.reference || id}`,
          }
        });
        adjustmentVoucherId = voucher.id;

        // Since we need to update stockLedger as well, doing it manually:
        for (const line of variances) {
          const varAmt = line.variance!.toNumber();
          const direction = varAmt > 0 ? "in" : "out";
          const absQty = Math.abs(varAmt);

          // Get rate
          const rateAggr = await tx.stockLedger.aggregate({
            where: { companyId, itemId: line.itemId },
            _avg: { rate: true }
          });
          const rate = rateAggr._avg.rate?.toNumber() || 0;
          let totalAmt = rate * absQty;
          let unitCost = new Prisma.Decimal(rate);
          if (direction === "out") {
            const cost = await this.inventoryService.consumeInventoryCost(tx, {
              companyId,
              itemId: line.itemId,
              qty: new Prisma.Decimal(absQty),
              costingMethod: settings.costingMethod,
              allowNegative: settings.allowNegativeStock,
              warehouseId: existing.warehouseId,
              binId: line.binId,
              batchNo: line.batchNo,
              lotNo: line.lotNo
            });
            unitCost = cost.unitCost;
            totalAmt = Number(cost.amount.toString());
          }

          // Add to stock ledger
          const ledger = await tx.stockLedger.create({
            data: {
              companyId,
              itemId: line.itemId,
              warehouseId: existing.warehouseId,
              binId: line.binId,
              date: new Date(),
              voucherId: voucher.id,
              sourceDocumentType: "stock_count",
              sourceDocumentId: existing.id,
              qtyIn: direction === "in" ? absQty : 0,
              qtyOut: direction === "out" ? absQty : 0,
              rate: unitCost,
              amount: totalAmt,
              batchNo: line.batchNo,
              lotNo: line.lotNo,
            }
          });

          if (direction === "in") {
            await this.inventoryService.receiveInventoryLayer(tx, {
              companyId,
              itemId: line.itemId,
              qty: new Prisma.Decimal(absQty),
              unitCost,
              date: ledger.date,
              sourceLedgerId: ledger.id,
              sourceVoucherId: voucher.id,
              sourceType: "stock_count",
              warehouseId: existing.warehouseId,
              binId: line.binId,
              batchNo: line.batchNo,
              lotNo: line.lotNo
            });
          }

          // Fetch item to know the inventory account (default to general inventory if not set)
          const item = await tx.item.findUnique({ where: { id: line.itemId }});
          
          // Accounting:
          // If in (variance > 0): Dr Inventory, Cr Adjustment
          // If out (variance < 0): Dr Adjustment, Cr Inventory
          const invAccountId = item?.expenseAccountId || adjustmentAccountId; // In a real app we'd have an inventory asset account on Item

          await tx.voucherLine.createMany({
            data: [
              {
                voucherId: voucher.id,
                companyId,
                lineNo: 1,
                accountId: direction === "in" ? invAccountId : adjustmentAccountId,
                debit: totalAmt,
                credit: 0
              },
              {
                voucherId: voucher.id,
                companyId,
                lineNo: 2,
                accountId: direction === "in" ? adjustmentAccountId : invAccountId,
                debit: 0,
                credit: totalAmt
              }
            ]
          });
        }
      }

      await tx.stockCount.update({
        where: { id },
        data: {
          status: "completed",
          completedAt: new Date(),
          adjustmentVoucherId
        }
      });

      return tx.stockCount.findFirst({ where: { id }, include: { lines: true } });
    });
  }

  async delete(companyId: string, id: string) {
    const existing = await this.getById(companyId, id);
    if (existing.status === "completed") {
      throw new BadRequestException("Cannot delete a completed stock count");
    }
    return this.prisma.stockCount.delete({ where: { id } });
  }

  private async assertCountPolicy(
    companyId: string,
    lines: Array<{ itemId: string; binId?: string | null; batchNo?: string | null; lotNo?: string | null }>,
    warehouseId?: string | null,
    tx?: Prisma.TransactionClient
  ) {
    const settings = await this.inventoryService.getOrCreateSettings(companyId, tx);
    if (!settings.inventoryTrackingEnabled) throw new BadRequestException("Inventory tracking is disabled");
    if ((warehouseId || settings.requireWarehouseOnMovements) && !settings.warehousesEnabled) {
      throw new BadRequestException("Warehouse tracking is disabled in inventory configuration");
    }
    if (settings.requireWarehouseOnMovements && !warehouseId) {
      throw new BadRequestException("Warehouse is required for stock counts");
    }
    if (lines.some((line) => line.binId) && !settings.binsEnabled) {
      throw new BadRequestException("Bin tracking is disabled in inventory configuration");
    }
    if (lines.some((line) => line.batchNo) && !settings.batchTrackingEnabled) {
      throw new BadRequestException("Batch tracking is disabled in inventory configuration");
    }
    if (lines.some((line) => line.lotNo) && !settings.lotTrackingEnabled) {
      throw new BadRequestException("Lot tracking is disabled in inventory configuration");
    }

    const db = (tx ?? this.prisma) as any;
    if (warehouseId) {
      const warehouse = await db.warehouse.findFirst({ where: { id: warehouseId, companyId, isActive: true } });
      if (!warehouse) throw new BadRequestException("Warehouse not found");
    }

    const itemIds = Array.from(new Set(lines.map((line) => line.itemId)));
    const items = await db.item.findMany({
      where: { id: { in: itemIds }, companyId },
      select: { id: true, type: true, trackInventory: true, tracksBatch: true, tracksLot: true }
    });
    const itemMap = new Map<string, any>(items.map((item: any) => [item.id, item]));
    for (const line of lines) {
      const item = itemMap.get(line.itemId);
      if (!item || item.type === "services" || item.trackInventory === false) {
        throw new BadRequestException("Stock counts can only include stock-tracked goods");
      }
      if (item.tracksBatch && !line.batchNo) throw new BadRequestException("Batch number is required for this item");
      if (item.tracksLot && !line.lotNo) throw new BadRequestException("Lot number is required for this item");
    }
  }
}
