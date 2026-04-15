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
exports.SyncController = void 0;
const common_1 = require("@nestjs/common");
const auth_decorator_1 = require("../../common/auth/auth.decorator");
const zod_pipe_1 = require("../../common/zod/zod.pipe");
const sync_schemas_1 = require("./dto/sync.schemas");
const sync_service_1 = require("./sync.service");
let SyncController = class SyncController {
    sync;
    constructor(sync) {
        this.sync = sync;
    }
    register(user, body) {
        return this.sync.registerDevice(user, body);
    }
    nextNumber(user, body) {
        return this.sync.reserveNextNumber(user, body);
    }
    ping() {
        return this.sync.ping();
    }
    push(user, body) {
        return this.sync.pushChanges(user, body);
    }
    pull(user, query) {
        return this.sync.pullChanges(user, query);
    }
};
exports.SyncController = SyncController;
__decorate([
    (0, common_1.Post)("devices/register"),
    (0, auth_decorator_1.RequirePerm)("masters.write"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(sync_schemas_1.RegisterDeviceSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], SyncController.prototype, "register", null);
__decorate([
    (0, common_1.Post)("next-number"),
    (0, auth_decorator_1.RequirePerm)("voucher.post"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(sync_schemas_1.NextNumberSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], SyncController.prototype, "nextNumber", null);
__decorate([
    (0, common_1.Get)("ping"),
    (0, auth_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SyncController.prototype, "ping", null);
__decorate([
    (0, common_1.Post)("push"),
    (0, auth_decorator_1.RequirePerm)("masters.write"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(sync_schemas_1.PushChangeSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], SyncController.prototype, "push", null);
__decorate([
    (0, common_1.Get)("pull"),
    (0, auth_decorator_1.RequirePerm)("masters.read"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)(new zod_pipe_1.ZodValidationPipe(sync_schemas_1.PullQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], SyncController.prototype, "pull", null);
exports.SyncController = SyncController = __decorate([
    (0, common_1.Controller)("sync"),
    __metadata("design:paramtypes", [sync_service_1.SyncService])
], SyncController);
//# sourceMappingURL=sync.controller.js.map