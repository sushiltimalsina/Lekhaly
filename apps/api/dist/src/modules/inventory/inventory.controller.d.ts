import type { AuthUser } from "../../common/auth/auth.types";
import { InventoryService } from "./inventory.service";
export declare class InventoryController {
    private inventory;
    constructor(inventory: InventoryService);
    adjust(user: AuthUser, body: any): Promise<{
        ok: boolean;
        voucherId: string;
    }>;
}
