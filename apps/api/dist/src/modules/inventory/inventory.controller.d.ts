import type { AuthUser } from "../../common/auth/auth.types";
import { InventoryService } from "./inventory.service";
export declare class InventoryController {
    private inventory;
    constructor(inventory: InventoryService);
    adjust(user: AuthUser, body: any): Promise<{
        ok: boolean;
        voucherId: string;
    }>;
    report(user: AuthUser, query: any): Promise<{
        id: string;
        name: string;
        sku: string | null;
        hsCode: any;
        unit: string | null;
        type: any;
        parentGroup: string;
        openingQty: number;
        openingAvgPrice: number;
        openingAmt: number;
        purchaseQty: number;
        purchaseAvgPrice: number;
        purchaseAmt: number;
        saleQty: number;
        saleAvgPrice: number;
        saleAmt: number;
        closingQty: number;
        closingPrice: number;
        closingAmt: number;
    }[]>;
}
