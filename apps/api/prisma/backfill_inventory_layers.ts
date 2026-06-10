import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

type LedgerRow = {
  id: string;
  companyId: string;
  itemId: string;
  warehouseId: string | null;
  binId: string | null;
  batchNo: string | null;
  lotNo: string | null;
  expiryDate: Date | null;
  expiryDateBs: string | null;
  date: Date;
  voucherId: string | null;
  qtyIn: Prisma.Decimal;
  qtyOut: Prisma.Decimal;
  amount: Prisma.Decimal;
};

type VirtualLayer = {
  sourceLedgerId: string;
  sourceVoucherId: string | null;
  companyId: string;
  itemId: string;
  warehouseId: string | null;
  binId: string | null;
  batchNo: string | null;
  lotNo: string | null;
  expiryDate: Date | null;
  expiryDateBs: string | null;
  receivedDate: Date;
  qtyIn: Prisma.Decimal;
  remainingQty: Prisma.Decimal;
  unitCost: Prisma.Decimal;
};

function scopeKey(row: Pick<LedgerRow, "itemId" | "warehouseId" | "binId" | "batchNo" | "lotNo" | "expiryDate">) {
  return [
    row.itemId,
    row.warehouseId ?? "",
    row.binId ?? "",
    row.batchNo ?? "",
    row.lotNo ?? "",
    row.expiryDate ? row.expiryDate.toISOString() : ""
  ].join("__");
}

function consume(layers: VirtualLayer[], qty: Prisma.Decimal) {
  let remaining = qty;
  for (const layer of layers) {
    if (remaining.lte(0)) break;
    if (layer.remainingQty.lte(0)) continue;
    const take = layer.remainingQty.gte(remaining) ? remaining : layer.remainingQty;
    layer.remainingQty = layer.remainingQty.sub(take);
    remaining = remaining.sub(take);
  }
  return remaining;
}

async function main() {
  const rows = await prisma.stockLedger.findMany({
    orderBy: [{ date: "asc" }, { createdAt: "asc" }, { id: "asc" }]
  });

  const layersByScope = new Map<string, VirtualLayer[]>();
  const allLayers: VirtualLayer[] = [];
  let inboundRows = 0;
  let outboundRows = 0;
  let unallocatedOutQty = new Prisma.Decimal(0);

  for (const row of rows as LedgerRow[]) {
    const key = scopeKey(row);
    if (row.qtyIn.gt(0)) {
      inboundRows += 1;
      const unitCost = row.qtyIn.gt(0) ? row.amount.div(row.qtyIn) : new Prisma.Decimal(0);
      const layer: VirtualLayer = {
        sourceLedgerId: row.id,
        sourceVoucherId: row.voucherId,
        companyId: row.companyId,
        itemId: row.itemId,
        warehouseId: row.warehouseId,
        binId: row.binId,
        batchNo: row.batchNo,
        lotNo: row.lotNo,
        expiryDate: row.expiryDate,
        expiryDateBs: row.expiryDateBs,
        receivedDate: row.date,
        qtyIn: row.qtyIn,
        remainingQty: row.qtyIn,
        unitCost
      };
      const scoped = layersByScope.get(key) ?? [];
      scoped.push(layer);
      layersByScope.set(key, scoped);
      allLayers.push(layer);
    }

    if (row.qtyOut.gt(0)) {
      outboundRows += 1;
      const scoped = layersByScope.get(key) ?? [];
      let remaining = consume(scoped, row.qtyOut);
      if (remaining.gt(0)) {
        const itemWide = allLayers.filter((layer) => layer.itemId === row.itemId && layer.remainingQty.gt(0));
        remaining = consume(itemWide, remaining);
      }
      if (remaining.gt(0)) unallocatedOutQty = unallocatedOutQty.add(remaining);
    }
  }

  const remainingLayers = allLayers.filter((layer) => layer.remainingQty.gt(0));

  await prisma.$transaction(async (tx) => {
    await tx.inventoryLayer.deleteMany({});
    if (!remainingLayers.length) return;
    await tx.inventoryLayer.createMany({
      data: remainingLayers.map((layer) => ({
        companyId: layer.companyId,
        itemId: layer.itemId,
        sourceLedgerId: layer.sourceLedgerId,
        sourceVoucherId: layer.sourceVoucherId,
        sourceType: "backfill",
        warehouseId: layer.warehouseId,
        binId: layer.binId,
        batchNo: layer.batchNo,
        lotNo: layer.lotNo,
        expiryDate: layer.expiryDate,
        expiryDateBs: layer.expiryDateBs,
        receivedDate: layer.receivedDate,
        qtyIn: layer.qtyIn,
        remainingQty: layer.remainingQty,
        unitCost: layer.unitCost,
        totalCost: layer.remainingQty.mul(layer.unitCost)
      }))
    });
  });

  const totalQty = remainingLayers.reduce((sum, layer) => sum.add(layer.remainingQty), new Prisma.Decimal(0));
  const totalValue = remainingLayers.reduce((sum, layer) => sum.add(layer.remainingQty.mul(layer.unitCost)), new Prisma.Decimal(0));

  console.log(JSON.stringify({
    stockLedgerRows: rows.length,
    inboundRows,
    outboundRows,
    layersCreated: remainingLayers.length,
    remainingQty: totalQty.toString(),
    remainingValue: totalValue.toFixed(2),
    unallocatedOutQty: unallocatedOutQty.toString()
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
