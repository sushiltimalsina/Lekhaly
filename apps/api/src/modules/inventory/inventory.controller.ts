import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { Audit } from "../../common/audit/audit.decorator";
import { CurrentUser, RequirePerm, RequireStep } from "../../common/auth/auth.decorator";
import { ZodValidationPipe } from "../../common/zod/zod.pipe";
import type { AuthUser } from "../../common/auth/auth.types";
import {
  InventoryAlertsQuerySchema,
  InventorySettingsSchema,
  SerialQuerySchema,
  StockAgingQuerySchema,
  StockAdjustmentSchema,
  StockQuerySchema,
  StockTransferSchema
} from "./dto/inventory.schemas";
import { InventoryService } from "./inventory.service";

@Controller("inventory")
@Audit({ entityType: "inventory", idParam: "id" })
export class InventoryController {
  constructor(private inventory: InventoryService) {}

  @Get("settings")
  @RequirePerm("masters.read")
  settings(@CurrentUser() user: AuthUser) {
    return this.inventory.getSettings(user);
  }

  @Post("settings")
  @RequirePerm("masters.write")
  updateSettings(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(InventorySettingsSchema)) body: any
  ) {
    return this.inventory.updateSettings(user, body);
  }

  @Get("serials")
  @RequirePerm("masters.read")
  serials(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(SerialQuerySchema)) query: any
  ) {
    return this.inventory.listSerialNumbers(user, query);
  }

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

  @Get("stock-aging")
  @RequirePerm("masters.read")
  stockAging(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(StockAgingQuerySchema)) query: any
  ) {
    return this.inventory.getStockAgingReport(user, query);
  }

  @Post("transfer")
  @RequirePerm("masters.write")
  @RequireStep("sensitive")
  transfer(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(StockTransferSchema)) body: any
  ) {
    return this.inventory.transferStock(user, body);
  }

  @Get("alerts")
  @RequirePerm("masters.read")
  alerts(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(InventoryAlertsQuerySchema)) query: any
  ) {
    return this.inventory.getInventoryAlerts(user, query);
  }
}
