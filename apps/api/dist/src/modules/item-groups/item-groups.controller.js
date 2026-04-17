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
exports.ItemGroupsController = void 0;
const common_1 = require("@nestjs/common");
const auth_decorator_1 = require("../../common/auth/auth.decorator");
const zod_pipe_1 = require("../../common/zod/zod.pipe");
const item_group_schemas_1 = require("./dto/item-group.schemas");
const item_groups_service_1 = require("./item-groups.service");
let ItemGroupsController = class ItemGroupsController {
    groups;
    constructor(groups) {
        this.groups = groups;
    }
    create(user, body) {
        return this.groups.create(user, body);
    }
    update(user, id, body) {
        return this.groups.update(user, id, body);
    }
    list(user, query) {
        return this.groups.list(user, query);
    }
    remove(user, id) {
        return this.groups.remove(user, id);
    }
};
exports.ItemGroupsController = ItemGroupsController;
__decorate([
    (0, common_1.Post)(),
    (0, auth_decorator_1.RequirePerm)("masters.write"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(item_group_schemas_1.CreateItemGroupSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ItemGroupsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, auth_decorator_1.RequirePerm)("masters.write"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(item_group_schemas_1.CreateItemGroupSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], ItemGroupsController.prototype, "update", null);
__decorate([
    (0, common_1.Get)(),
    (0, auth_decorator_1.RequirePerm)("masters.read"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)(new zod_pipe_1.ZodValidationPipe(item_group_schemas_1.ListItemGroupQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ItemGroupsController.prototype, "list", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, auth_decorator_1.RequirePerm)("masters.write"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ItemGroupsController.prototype, "remove", null);
exports.ItemGroupsController = ItemGroupsController = __decorate([
    (0, common_1.Controller)("item-groups"),
    __metadata("design:paramtypes", [item_groups_service_1.ItemGroupsService])
], ItemGroupsController);
//# sourceMappingURL=item-groups.controller.js.map