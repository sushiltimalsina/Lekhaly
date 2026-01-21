import { z } from "zod";

export const CreateBankAccountSchema = z.object({
  accountId: z.string().uuid(),
  bankName: z.string().trim().max(100).optional(),
  accountNumber: z.string().trim().max(50).optional()
});

export const CreateBankStatementSchema = z.object({
  bankAccountId: z.string().uuid(),
  periodFrom: z.coerce.date(),
  periodTo: z.coerce.date(),
  openingBalance: z.number(),
  closingBalance: z.number()
});

export const AddStatementLineSchema = z.object({
  date: z.coerce.date(),
  description: z.string().trim().max(500).optional(),
  amount: z.number(),
  debitCredit: z.enum(["debit", "credit"])
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
