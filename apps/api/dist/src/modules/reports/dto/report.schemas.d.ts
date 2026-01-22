import { z } from "zod";
export declare const ReportQuerySchema: z.ZodObject<{
    from: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    fromBs: z.ZodOptional<z.ZodString>;
    to: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    toBs: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const PartyAgingQuerySchema: z.ZodObject<{
    from: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    fromBs: z.ZodOptional<z.ZodString>;
    to: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    toBs: z.ZodOptional<z.ZodString>;
    asOf: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    asOfBs: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const PartyLedgerQuerySchema: z.ZodObject<{
    partyId: z.ZodString;
    from: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    fromBs: z.ZodOptional<z.ZodString>;
    to: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    toBs: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const ExportReportSchema: z.ZodObject<{
    report: z.ZodEnum<{
        "trial-balance": "trial-balance";
        "profit-loss": "profit-loss";
        "balance-sheet": "balance-sheet";
    }>;
    format: z.ZodDefault<z.ZodEnum<{
        csv: "csv";
        pdf: "pdf";
    }>>;
    from: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    to: z.ZodOptional<z.ZodCoercedDate<unknown>>;
}, z.core.$strip>;
