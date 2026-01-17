import { z } from "zod";
export declare const CreatePartySchema: z.ZodObject<{
    type: z.ZodDefault<z.ZodEnum<{
        customer: "customer";
        supplier: "supplier";
        both: "both";
    }>>;
    name: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    panNumber: z.ZodOptional<z.ZodString>;
    vatNumber: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const UpdatePartySchema: z.ZodObject<{
    type: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        customer: "customer";
        supplier: "supplier";
        both: "both";
    }>>>;
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    address: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    panNumber: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    vatNumber: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const ListPartyQuerySchema: z.ZodObject<{
    type: z.ZodOptional<z.ZodEnum<{
        customer: "customer";
        supplier: "supplier";
        both: "both";
    }>>;
    isActive: z.ZodOptional<z.ZodCoercedBoolean<unknown>>;
    q: z.ZodOptional<z.ZodString>;
    skip: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    take: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
