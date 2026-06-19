"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const audit_decorator_1 = require("../../common/audit/audit.decorator");
const auth_decorator_1 = require("../../common/auth/auth.decorator");
const zod_pipe_1 = require("../../common/zod/zod.pipe");
const inventory_schemas_1 = require("./dto/inventory.schemas");
const inventory_service_1 = require("./inventory.service");
let InventoryController = class InventoryController {
    inventory;
    constructor(inventory) {
        this.inventory = inventory;
    }
    settings(user) {
        return this.inventory.getSettings(user);
    }
    updateSettings(user, body) {
        return this.inventory.updateSettings(user, body);
    }
    serials(user, query) {
        return this.inventory.listSerialNumbers(user, query);
    }
    serialMovements(user, query) {
        return this.inventory.listSerialMovements(user, query);
    }
    adjust(user, body) {
        return this.inventory.adjustStock(user, body);
    }
    goodsReceipt(user, body) {
        return this.inventory.postGoodsReceipt(user, body);
    }
    goodsReceipts(user, query) {
        return this.inventory.listGoodsReceipts(user, query);
    }
    dispatches(user, query) {
        return this.inventory.listStockDispatches(user, query);
    }
    dispatch(user, body) {
        return this.inventory.postStockDispatch(user, body);
    }
    reservations(user, query) {
        return this.inventory.listReservations(user, query);
    }
    reserveSalesOrder(user, body) {
        return this.inventory.reserveSalesOrderStock(user, body.salesOrderId, { expiresAt: body.expiresAt });
    }
    releaseReservation(user, id) {
        return this.inventory.releaseReservation(user, id);
    }
    report(user, query) {
        return this.inventory.getStockReport(user, query);
    }
    stockAging(user, query) {
        return this.inventory.getStockAgingReport(user, query);
    }
    valuation(user, query) {
        return this.inventory.getStockValuationReport(user, query);
    }
    batchLots(user, query) {
        return this.inventory.listBatchLotMaster(user, query);
    }
    reorderSuggestions(user) {
        return this.inventory.getReorderSuggestions(user);
    }
    trackedStock(user, query) {
        return this.inventory.getTrackedStockOptions(user, query);
    }
    transfer(user, body) {
        return this.inventory.transferStock(user, body);
    }
    movementApprovals(user, query) {
        return this.inventory.listMovementApprovals(user, query);
    }
    createMovementApproval(user, body) {
        return this.inventory.createMovementApproval(user, body);
    }
    approveMovement(user, id, body) {
        return this.inventory.approveMovementApproval(user, id, body);
    }
    rejectMovement(user, id, body) {
        return this.inventory.rejectMovementApproval(user, id, body);
    }
    reverseMovement(user, id, body) {
        return this.inventory.reverseMovementApproval(user, id, body);
    }
    periodCloses(user, query) {
        return this.inventory.listPeriodCloses(user, query);
    }
    closePeriod(user, body) {
        return this.inventory.closeInventoryPeriod(user, body);
    }
    alerts(user, query) {
        return this.inventory.getInventoryAlerts(user, query);
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, common_1.Get)("settings"),
    (0, auth_decorator_1.RequirePerm)("masters.read"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "settings", null);
__decorate([
    (0, common_1.Post)("settings"),
    (0, auth_decorator_1.RequirePerm)("masters.write"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(inventory_schemas_1.InventorySettingsSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Get)("serials"),
    (0, auth_decorator_1.RequirePerm)("masters.read"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)(new zod_pipe_1.ZodValidationPipe(inventory_schemas_1.SerialQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "serials", null);
__decorate([
    (0, common_1.Get)("serial-movements"),
    (0, auth_decorator_1.RequirePerm)("masters.read"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)(new zod_pipe_1.ZodValidationPipe(inventory_schemas_1.SerialMovementQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "serialMovements", null);
__decorate([
    (0, common_1.Post)("adjustment"),
    (0, auth_decorator_1.RequirePerm)("masters.write"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(inventory_schemas_1.StockAdjustmentSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "adjust", null);
__decorate([
    (0, common_1.Post)("goods-receipts"),
    (0, auth_decorator_1.RequirePerm)("masters.write"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(inventory_schemas_1.GoodsReceiptSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "goodsReceipt", null);
__decorate([
    (0, common_1.Get)("goods-receipts"),
    (0, auth_decorator_1.RequirePerm)("masters.read"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)(new zod_pipe_1.ZodValidationPipe(inventory_schemas_1.GoodsReceiptQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "goodsReceipts", null);
__decorate([
    (0, common_1.Get)("dispatches"),
    (0, auth_decorator_1.RequirePerm)("masters.read"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)(new zod_pipe_1.ZodValidationPipe(inventory_schemas_1.StockDispatchQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "dispatches", null);
__decorate([
    (0, common_1.Post)("dispatches"),
    (0, auth_decorator_1.RequirePerm)("masters.write"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(inventory_schemas_1.StockDispatchSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "dispatch", null);
__decorate([
    (0, common_1.Get)("reservations"),
    (0, auth_decorator_1.RequirePerm)("masters.read"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)(new zod_pipe_1.ZodValidationPipe(inventory_schemas_1.ReservationQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "reservations", null);
__decorate([
    (0, common_1.Post)("reservations/sales-order"),
    (0, auth_decorator_1.RequirePerm)("masters.write"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(inventory_schemas_1.SalesOrderReservationSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "reserveSalesOrder", null);
__decorate([
    (0, common_1.Post)("reservations/:id/release"),
    (0, auth_decorator_1.RequirePerm)("masters.write"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "releaseReservation", null);
__decorate([
    (0, common_1.Get)("report"),
    (0, auth_decorator_1.RequirePerm)("masters.read"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)(new zod_pipe_1.ZodValidationPipe(inventory_schemas_1.StockQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "report", null);
__decorate([
    (0, common_1.Get)("stock-aging"),
    (0, auth_decorator_1.RequirePerm)("masters.read"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)(new zod_pipe_1.ZodValidationPipe(inventory_schemas_1.StockAgingQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "stockAging", null);
__decorate([
    (0, common_1.Get)("valuation"),
    (0, auth_decorator_1.RequirePerm)("masters.read"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)(new zod_pipe_1.ZodValidationPipe(inventory_schemas_1.StockValuationQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "valuation", null);
__decorate([
    (0, common_1.Get)("batch-lots"),
    (0, auth_decorator_1.RequirePerm)("masters.read"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)(new zod_pipe_1.ZodValidationPipe(inventory_schemas_1.BatchLotMasterQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "batchLots", null);
__decorate([
    (0, common_1.Get)("reorder-suggestions"),
    (0, auth_decorator_1.RequirePerm)("masters.read"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "reorderSuggestions", null);
__decorate([
    (0, common_1.Get)("tracked-stock"),
    (0, auth_decorator_1.RequirePerm)("masters.read"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)(new zod_pipe_1.ZodValidationPipe(inventory_schemas_1.TrackedStockQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "trackedStock", null);
__decorate([
    (0, common_1.Post)("transfer"),
    (0, auth_decorator_1.RequirePerm)("masters.write"),
    (0, auth_decorator_1.RequireStep)("sensitive"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(inventory_schemas_1.StockTransferSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "transfer", null);
__decorate([
    (0, common_1.Get)("movement-approvals"),
    (0, auth_decorator_1.RequirePerm)("masters.read"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)(new zod_pipe_1.ZodValidationPipe(inventory_schemas_1.MovementApprovalQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "movementApprovals", null);
__decorate([
    (0, common_1.Post)("movement-approvals"),
    (0, auth_decorator_1.RequirePerm)("masters.write"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(inventory_schemas_1.MovementApprovalRequestSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "createMovementApproval", null);
__decorate([
    (0, common_1.Post)("movement-approvals/:id/approve"),
    (0, auth_decorator_1.RequirePerm)("masters.write"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(inventory_schemas_1.MovementApprovalActionSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "approveMovement", null);
__decorate([
    (0, common_1.Post)("movement-approvals/:id/reject"),
    (0, auth_decorator_1.RequirePerm)("masters.write"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(inventory_schemas_1.MovementApprovalActionSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "rejectMovement", null);
__decorate([
    (0, common_1.Post)("movement-approvals/:id/reverse"),
    (0, auth_decorator_1.RequirePerm)("masters.write"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(inventory_schemas_1.MovementApprovalActionSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "reverseMovement", null);
__decorate([
    (0, common_1.Get)("period-closes"),
    (0, auth_decorator_1.RequirePerm)("masters.read"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)(new zod_pipe_1.ZodValidationPipe(inventory_schemas_1.InventoryPeriodCloseQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "periodCloses", null);
__decorate([
    (0, common_1.Post)("period-closes"),
    (0, auth_decorator_1.RequirePerm)("masters.write"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(inventory_schemas_1.InventoryPeriodCloseSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "closePeriod", null);
__decorate([
    (0, common_1.Get)("alerts"),
    (0, auth_decorator_1.RequirePerm)("masters.read"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)(new zod_pipe_1.ZodValidationPipe(inventory_schemas_1.InventoryAlertsQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "alerts", null);
exports.InventoryController = InventoryController = __decorate([
    (0, common_1.Controller)("inventory"),
    (0, audit_decorator_1.Audit)({ entityType: "inventory", idParam: "id" }),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map