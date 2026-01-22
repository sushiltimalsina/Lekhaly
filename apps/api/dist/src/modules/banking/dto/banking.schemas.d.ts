import { z } from "zod";
export declare const CreateBankAccountSchema: z.ZodObject<{
    accountId: z.ZodString;
    bankName: z.ZodOptional<z.ZodString>;
    accountNumber: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const CreateBankStatementSchema: z.ZodObject<{
    bankAccountId: z.ZodString;
    periodFrom: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    periodFromBs: z.ZodOptional<z.ZodString>;
    periodTo: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    periodToBs: z.ZodOptional<z.ZodString>;
    openingBalance: z.ZodNumber;
    closingBalance: z.ZodNumber;
}, z.core.$strip>;
export declare const AddStatementLineSchema: z.ZodObject<{
    date: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    dateBs: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    amount: z.ZodNumber;
    debitCredit: z.ZodEnum<{
        debit: "debit";
        credit: "credit";
    }>;
}, z.core.$strip>;
export declare const ReconcileSchema: z.ZodObject<{
    statementLineId: z.ZodString;
    voucherId: z.ZodString;
    voucherLineId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const BankStatementListQuerySchema: z.ZodObject<{
    bankAccountId: z.ZodOptional<z.ZodString>;
    from: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    to: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    skip: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    take: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const BankSyncConnectSchema: z.ZodObject<{
    provider: z.ZodString;
    bankAccountId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
