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
exports.RolesController = void 0;
const common_1 = require("@nestjs/common");
const audit_decorator_1 = require("../../common/audit/audit.decorator");
const auth_decorator_1 = require("../../common/auth/auth.decorator");
const zod_pipe_1 = require("../../common/zod/zod.pipe");
const roles_schemas_1 = require("./dto/roles.schemas");
const roles_service_1 = require("./roles.service");
let RolesController = class RolesController {
    roles;
    constructor(roles) {
        this.roles = roles;
    }
    list(user, query) {
        return this.roles.list(user, query);
    }
    permissions() {
        return this.roles.listPermissions();
    }
    getById(user, id) {
        return this.roles.getById(user, id);
    }
    create(user, body) {
        return this.roles.create(user, body);
    }
    update(user, id, body) {
        return this.roles.update(user, id, body);
    }
    remove(user, id) {
        return this.roles.remove(user, id);
    }
    assignUser(user, id, body) {
        return this.roles.assignUser(user, id, body.userId);
    }
    removeUser(user, id, userId) {
        return this.roles.removeUser(user, id, userId);
    }
};
exports.RolesController = RolesController;
__decorate([
    (0, common_1.Get)(),
    (0, auth_decorator_1.RequirePerm)("settings.security"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)(new zod_pipe_1.ZodValidationPipe(roles_schemas_1.RoleListQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)("permissions"),
    (0, auth_decorator_1.RequirePerm)("settings.security"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "permissions", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, auth_decorator_1.RequirePerm)("settings.security"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "getById", null);
__decorate([
    (0, common_1.Post)(),
    (0, auth_decorator_1.RequirePerm)("settings.security"),
    (0, auth_decorator_1.RequireStep)("sensitive"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(roles_schemas_1.CreateRoleSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(":id"),
    (0, auth_decorator_1.RequirePerm)("settings.security"),
    (0, auth_decorator_1.RequireStep)("sensitive"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(roles_schemas_1.UpdateRoleSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, auth_decorator_1.RequirePerm)("settings.security"),
    (0, auth_decorator_1.RequireStep)("sensitive"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(":id/users"),
    (0, auth_decorator_1.RequirePerm)("settings.security"),
    (0, auth_decorator_1.RequireStep)("sensitive"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(roles_schemas_1.AssignRoleUserSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "assignUser", null);
__decorate([
    (0, common_1.Delete)(":id/users/:userId"),
    (0, auth_decorator_1.RequirePerm)("settings.security"),
    (0, auth_decorator_1.RequireStep)("sensitive"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "removeUser", null);
exports.RolesController = RolesController = __decorate([
    (0, common_1.Controller)("roles"),
    (0, audit_decorator_1.Audit)({ entityType: "role", idParam: "id" }),
    __metadata("design:paramtypes", [roles_service_1.RolesService])
], RolesController);
//# sourceMappingURL=roles.controller.js.map