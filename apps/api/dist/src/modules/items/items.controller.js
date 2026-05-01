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
exports.ItemsController = void 0;
const common_1 = require("@nestjs/common");
const auth_decorator_1 = require("../../common/auth/auth.decorator");
const zod_pipe_1 = require("../../common/zod/zod.pipe");
const inventory_schemas_1 = require("../inventory/dto/inventory.schemas");
const item_schemas_1 = require("./dto/item.schemas");
const items_service_1 = require("./items.service");
const inventory_service_1 = require("../inventory/inventory.service");
let ItemsController = class ItemsController {
    items;
    inventory;
    constructor(items, inventory) {
        this.items = items;
        this.inventory = inventory;
    }
    create(user, body) {
        return this.items.create(user, body);
    }
    update(user, id, body) {
        return this.items.update(user, id, body);
    }
    get(user, id) {
        return this.items.get(user, id);
    }
    stock(user, id, query) {
        return this.inventory.getStock(user, id, query);
    }
    list(user, query) {
        return this.items.list(user, query);
    }
    remove(user, id) {
        return this.items.remove(user, id);
    }
    restore(user, id) {
        return this.items.restore(user, id);
    }
    assemble(user, id, body) {
        return this.items.assemble(user, id, body.qty, body.memo, body.components, body.sundries);
    }
    disassemble(user, id, body) {
        return this.items.disassemble(user, id, body.qty, body.components, body.sundries);
    }
};
exports.ItemsController = ItemsController;
__decorate([
    (0, common_1.Post)(),
    (0, auth_decorator_1.RequirePerm)("masters.write"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(item_schemas_1.CreateItemSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ItemsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(":id"),
    (0, auth_decorator_1.RequirePerm)("masters.write"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(item_schemas_1.UpdateItemSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], ItemsController.prototype, "update", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, auth_decorator_1.RequirePerm)("masters.read"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ItemsController.prototype, "get", null);
__decorate([
    (0, common_1.Get)(":id/stock"),
    (0, auth_decorator_1.RequirePerm)("masters.read"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Query)(new zod_pipe_1.ZodValidationPipe(inventory_schemas_1.StockQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], ItemsController.prototype, "stock", null);
__decorate([
    (0, common_1.Get)(),
    (0, auth_decorator_1.RequirePerm)("masters.read"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)(new zod_pipe_1.ZodValidationPipe(item_schemas_1.ListItemQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ItemsController.prototype, "list", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, auth_decorator_1.RequirePerm)("masters.write"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ItemsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(":id/restore"),
    (0, auth_decorator_1.RequirePerm)("masters.write"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ItemsController.prototype, "restore", null);
__decorate([
    (0, common_1.Post)(":id/assemble"),
    (0, auth_decorator_1.RequirePerm)("masters.write"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], ItemsController.prototype, "assemble", null);
__decorate([
    (0, common_1.Post)(":id/disassemble"),
    (0, auth_decorator_1.RequirePerm)("masters.write"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], ItemsController.prototype, "disassemble", null);
exports.ItemsController = ItemsController = __decorate([
    (0, common_1.Controller)("items"),
    __metadata("design:paramtypes", [items_service_1.ItemsService,
        inventory_service_1.InventoryService])
], ItemsController);
//# sourceMappingURL=items.controller.js.map