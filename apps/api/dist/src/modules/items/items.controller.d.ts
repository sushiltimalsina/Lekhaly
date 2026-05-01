import type { AuthUser } from "../../common/auth/auth.types";
import { ItemsService } from "./items.service";
import { InventoryService } from "../inventory/inventory.service";
export declare class ItemsController {
    private items;
    private inventory;
    constructor(items: ItemsService, inventory: InventoryService);
    create(user: AuthUser, body: any): any;
    update(user: AuthUser, id: string, body: any): any;
    get(user: AuthUser, id: string): any;
    stock(user: AuthUser, id: string, query: any): Promise<{
        itemId: string;
        qty: import("@prisma/client/runtime/client").Decimal;
        entries: {
            id: string;
            date: Date;
            dateBs: string | null;
            qtyIn: number;
            qtyOut: number;
            rate: number;
            amount: number;
            batchNo: string | null;
            lotNo: string | null;
            expiryDate: Date | null;
            expiryDateBs: string | null;
            voucherId: string | null;
            voucherNumber: string | null;
            voucherType: import("@prisma/client").$Enums.VoucherType | null;
            voucherDate: Date | null;
        }[];
    }>;
    list(user: AuthUser, query: any): any;
    remove(user: AuthUser, id: string): any;
    restore(user: AuthUser, id: string): any;
    assemble(user: AuthUser, id: string, body: {
        qty: number;
        memo?: string;
        components?: Array<{
            componentId: string;
            consumedQty: number;
        }>;
        sundries?: Array<{
            sundryId: string;
            amount: number;
        }>;
    }): any;
    disassemble(user: AuthUser, id: string, body: {
        qty: number;
        components?: Array<{
            componentId: string;
            consumedQty: number;
        }>;
        sundries?: Array<{
            sundryId: string;
            amount: number;
        }>;
    }): any;
}
