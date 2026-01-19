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
exports.OutboxController = void 0;
const common_1 = require("@nestjs/common");
const audit_decorator_1 = require("../../common/audit/audit.decorator");
const auth_decorator_1 = require("../../common/auth/auth.decorator");
const zod_pipe_1 = require("../../common/zod/zod.pipe");
const outbox_schemas_1 = require("./dto/outbox.schemas");
const outbox_service_1 = require("./outbox.service");
let OutboxController = class OutboxController {
    outbox;
    constructor(outbox) {
        this.outbox = outbox;
    }
    list(user, query) {
        return this.outbox.list(user, query);
    }
    ack(user, id, body) {
        return this.outbox.ack(user, id, body);
    }
};
exports.OutboxController = OutboxController;
__decorate([
    (0, common_1.Get)(),
    (0, auth_decorator_1.RequirePerm)("settings.security"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)(new zod_pipe_1.ZodValidationPipe(outbox_schemas_1.OutboxListQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], OutboxController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(":id/ack"),
    (0, auth_decorator_1.RequirePerm)("settings.security"),
    (0, auth_decorator_1.RequireStep)("sensitive"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(outbox_schemas_1.OutboxAckSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], OutboxController.prototype, "ack", null);
exports.OutboxController = OutboxController = __decorate([
    (0, common_1.Controller)("outbox"),
    (0, audit_decorator_1.Audit)({ entityType: "outbox", idParam: "id" }),
    __metadata("design:paramtypes", [outbox_service_1.OutboxService])
], OutboxController);
//# sourceMappingURL=outbox.controller.js.map