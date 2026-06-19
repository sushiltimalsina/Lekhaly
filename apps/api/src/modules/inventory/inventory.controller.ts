import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { Audit } from "../../common/audit/audit.decorator";
import { CurrentUser, RequirePerm, RequireStep } from "../../common/auth/auth.decorator";
import { ZodValidationPipe } from "../../common/zod/zod.pipe";
import type { AuthUser } from "../../common/auth/auth.types";
import {
  InventoryAlertsQuerySchema,
  BatchLotMasterQuerySchema,
  GoodsReceiptQuerySchema,
  GoodsReceiptSchema,
  InventoryPeriodCloseQuerySchema,
  InventoryPeriodCloseSchema,
  InventorySettingsSchema,
  MovementApprovalActionSchema,
  MovementApprovalQuerySchema,
  MovementApprovalRequestSchema,
  ReservationQuerySchema,
  SerialMovementQuerySchema,
  SerialQuerySchema,
  SalesOrderReservationSchema,
  StockAgingQuerySchema,
  StockAdjustmentSchema,
  StockDispatchSchema,
  StockDispatchQuerySchema,
  StockQuerySchema,
  TrackedStockQuerySchema,
  StockValuationQuerySchema,
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

  @Get("serial-movements")
  @RequirePerm("masters.read")
  serialMovements(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(SerialMovementQuerySchema)) query: any
  ) {
    return this.inventory.listSerialMovements(user, query);
  }

  @Post("adjustment")
  @RequirePerm("masters.write")
  adjust(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(StockAdjustmentSchema)) body: any
  ) {
    return this.inventory.adjustStock(user, body);
  }

  @Post("goods-receipts")
  @RequirePerm("masters.write")
  goodsReceipt(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(GoodsReceiptSchema)) body: any
  ) {
    return this.inventory.postGoodsReceipt(user, body);
  }

  @Get("goods-receipts")
  @RequirePerm("masters.read")
  goodsReceipts(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(GoodsReceiptQuerySchema)) query: any
  ) {
    return this.inventory.listGoodsReceipts(user, query);
  }

  @Get("dispatches")
  @RequirePerm("masters.read")
  dispatches(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(StockDispatchQuerySchema)) query: any
  ) {
    return this.inventory.listStockDispatches(user, query);
  }

  @Post("dispatches")
  @RequirePerm("masters.write")
  dispatch(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(StockDispatchSchema)) body: any
  ) {
    return this.inventory.postStockDispatch(user, body);
  }

  @Get("reservations")
  @RequirePerm("masters.read")
  reservations(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(ReservationQuerySchema)) query: any
  ) {
    return this.inventory.listReservations(user, query);
  }

  @Post("reservations/sales-order")
  @RequirePerm("masters.write")
  reserveSalesOrder(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(SalesOrderReservationSchema)) body: any
  ) {
    return this.inventory.reserveSalesOrderStock(user, body.salesOrderId, { expiresAt: body.expiresAt });
  }

  @Post("reservations/:id/release")
  @RequirePerm("masters.write")
  releaseReservation(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.inventory.releaseReservation(user, id);
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

  @Get("valuation")
  @RequirePerm("masters.read")
  valuation(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(StockValuationQuerySchema)) query: any
  ) {
    return this.inventory.getStockValuationReport(user, query);
  }

  @Get("batch-lots")
  @RequirePerm("masters.read")
  batchLots(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(BatchLotMasterQuerySchema)) query: any
  ) {
    return this.inventory.listBatchLotMaster(user, query);
  }

  @Get("reorder-suggestions")
  @RequirePerm("masters.read")
  reorderSuggestions(@CurrentUser() user: AuthUser) {
    return this.inventory.getReorderSuggestions(user);
  }

  @Get("tracked-stock")
  @RequirePerm("masters.read")
  trackedStock(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(TrackedStockQuerySchema)) query: any
  ) {
    return this.inventory.getTrackedStockOptions(user, query);
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

  @Get("movement-approvals")
  @RequirePerm("masters.read")
  movementApprovals(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(MovementApprovalQuerySchema)) query: any
  ) {
    return this.inventory.listMovementApprovals(user, query);
  }

  @Post("movement-approvals")
  @RequirePerm("masters.write")
  createMovementApproval(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(MovementApprovalRequestSchema)) body: any
  ) {
    return this.inventory.createMovementApproval(user, body);
  }

  @Post("movement-approvals/:id/approve")
  @RequirePerm("masters.write")
  approveMovement(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(MovementApprovalActionSchema)) body: any
  ) {
    return this.inventory.approveMovementApproval(user, id, body);
  }

  @Post("movement-approvals/:id/reject")
  @RequirePerm("masters.write")
  rejectMovement(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(MovementApprovalActionSchema)) body: any
  ) {
    return this.inventory.rejectMovementApproval(user, id, body);
  }

  @Post("movement-approvals/:id/reverse")
  @RequirePerm("masters.write")
  reverseMovement(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(MovementApprovalActionSchema)) body: any
  ) {
    return this.inventory.reverseMovementApproval(user, id, body);
  }

  @Get("period-closes")
  @RequirePerm("masters.read")
  periodCloses(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(InventoryPeriodCloseQuerySchema)) query: any
  ) {
    return this.inventory.listPeriodCloses(user, query);
  }

  @Post("period-closes")
  @RequirePerm("masters.write")
  closePeriod(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(InventoryPeriodCloseSchema)) body: any
  ) {
    return this.inventory.closeInventoryPeriod(user, body);
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
