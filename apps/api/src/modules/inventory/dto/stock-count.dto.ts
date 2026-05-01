import { z } from "zod";

export const createStockCountSchema = z.object({
  reference: z.string().optional(),
  warehouseId: z.string().uuid().optional(),
  countDate: z.string(),
  countDateBs: z.string().optional(),
  memo: z.string().optional(),
  lines: z.array(z.object({
    itemId: z.string().uuid(),
    binId: z.string().uuid().optional(),
    countedQty: z.number().optional(),
    batchNo: z.string().optional(),
    lotNo: z.string().optional(),
    note: z.string().optional()
  })).min(1, "At least one line is required")
});

export const updateStockCountSchema = z.object({
  reference: z.string().optional(),
  warehouseId: z.string().uuid().optional(),
  countDate: z.string().optional(),
  countDateBs: z.string().optional(),
  memo: z.string().optional(),
  status: z.enum(["draft", "in_progress", "completed", "cancelled"]).optional(),
  lines: z.array(z.object({
    id: z.string().uuid().optional(),
    itemId: z.string().uuid(),
    binId: z.string().uuid().optional(),
    countedQty: z.number().optional(),
    batchNo: z.string().optional(),
    lotNo: z.string().optional(),
    note: z.string().optional()
  })).optional()
});

export type CreateStockCountDto = z.infer<typeof createStockCountSchema>;
export type UpdateStockCountDto = z.infer<typeof updateStockCountSchema>;
