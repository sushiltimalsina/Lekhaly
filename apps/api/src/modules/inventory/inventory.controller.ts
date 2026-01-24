import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { Audit } from "../../common/audit/audit.decorator";
import { CurrentUser, RequirePerm, RequireStep } from "../../common/auth/auth.decorator";
import { ZodValidationPipe } from "../../common/zod/zod.pipe";
import type { AuthUser } from "../../common/auth/auth.types";
import { StockAdjustmentSchema, StockQuerySchema } from "./dto/inventory.schemas";
import { InventoryService } from "./inventory.service";

@Controller("inventory")
@Audit({ entityType: "inventory", idParam: "id" })
export class InventoryController {
  constructor(private inventory: InventoryService) {}

  @Post("adjustment")
  @RequirePerm("masters.write")
  @RequireStep("sensitive")
  adjust(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(StockAdjustmentSchema)) body: any
  ) {
    return this.inventory.adjustStock(user, body);
  }

  @Get("report")
  @RequirePerm("masters.read")
  report(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(StockQuerySchema)) query: any
  ) {
    return this.inventory.getStockReport(user, query);
  }
}
