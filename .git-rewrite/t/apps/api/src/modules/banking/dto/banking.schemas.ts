import { z } from "zod";

export const CreateBankAccountSchema = z.object({
  accountId: z.string().uuid(),
  bankName: z.string().trim().max(100).optional(),
  accountNumber: z.string().trim().max(50).optional()
});

export const CreateBankStatementSchema = z.object({
  bankAccountId: z.string().uuid(),
  periodFrom: z.coerce.date().optional(),
  periodFromBs: z.string().trim().max(20).optional(),
  periodTo: z.coerce.date().optional(),
  periodToBs: z.string().trim().max(20).optional(),
  openingBalance: z.number(),
  closingBalance: z.number()
}).superRefine((data, ctx) => {
  if (!data.periodFrom && !data.periodFromBs) {
    ctx.addIssue({ code: "custom", message: "periodFrom or periodFromBs is required", path: ["periodFrom"] });
  }
  if (!data.periodTo && !data.periodToBs) {
    ctx.addIssue({ code: "custom", message: "periodTo or periodToBs is required", path: ["periodTo"] });
  }
});

export const AddStatementLineSchema = z.object({
  date: z.coerce.date().optional(),
  dateBs: z.string().trim().max(20).optional(),
  description: z.string().trim().max(500).optional(),
  amount: z.number(),
  debitCredit: z.enum(["debit", "credit"])
}).superRefine((data, ctx) => {
  if (!data.date && !data.dateBs) {
    ctx.addIssue({ code: "custom", message: "date or dateBs is required", path: ["date"] });
  }
});

export const ReconcileSchema = z.object({
  statementLineId: z.string().uuid(),
  voucherId: z.string().uuid(),
  voucherLineId: z.string().uuid().optional()
});

export const BankStatementListQuerySchema = z.object({
  bankAccountId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  skip: z.coerce.number().int().min(0).optional(),
  take: z.coerce.number().int().min(1).max(200).optional()
});

export const BankSyncConnectSchema = z.object({
  provider: z.string().trim().min(2).max(50),
  bankAccountId: z.string().uuid().optional()
});
