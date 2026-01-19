import { z } from "zod";
export declare const ReportQuerySchema: z.ZodObject<{
    from: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    to: z.ZodOptional<z.ZodCoercedDate<unknown>>;
}, z.core.$strip>;
export declare const PartyAgingQuerySchema: z.ZodObject<{
    from: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    to: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    asOf: z.ZodOptional<z.ZodCoercedDate<unknown>>;
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
