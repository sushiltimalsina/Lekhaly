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
exports.VouchersController = void 0;
const common_1 = require("@nestjs/common");
const auth_decorator_1 = require("../../common/auth/auth.decorator");
const zod_pipe_1 = require("../../common/zod/zod.pipe");
const voucher_schemas_1 = require("./dto/voucher.schemas");
const vouchers_service_1 = require("./vouchers.service");
let VouchersController = class VouchersController {
    vouchers;
    constructor(vouchers) {
        this.vouchers = vouchers;
    }
    createDraft(user, body, idempotencyKey) {
        return this.vouchers.createDraft(user, body, idempotencyKey);
    }
    updateDraft(user, id, body) {
        return this.vouchers.updateDraft(user, id, body);
    }
    getById(user, id) {
        return this.vouchers.getById(user, id);
    }
    preview(user, id) {
        return this.vouchers.preview(user, id);
    }
    list(user, query) {
        return this.vouchers.list(user, query);
    }
    post(user, id, idempotencyKey) {
        return this.vouchers.post(user, id, idempotencyKey);
    }
    void(user, id, idempotencyKey) {
        return this.vouchers.void(user, id, idempotencyKey);
    }
};
exports.VouchersController = VouchersController;
__decorate([
    (0, common_1.Post)("draft"),
    (0, auth_decorator_1.RequirePerm)("voucher.draft.create"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(voucher_schemas_1.CreateVoucherDraftSchema))),
    __param(2, (0, common_1.Headers)("Idempotency-Key")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", void 0)
], VouchersController.prototype, "createDraft", null);
__decorate([
    (0, common_1.Put)(":id/draft"),
    (0, auth_decorator_1.RequirePerm)("voucher.draft.edit"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(voucher_schemas_1.UpdateVoucherDraftSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], VouchersController.prototype, "updateDraft", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, auth_decorator_1.RequirePerm)("voucher.preview"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], VouchersController.prototype, "getById", null);
__decorate([
    (0, common_1.Get)(":id/preview"),
    (0, auth_decorator_1.RequirePerm)("voucher.preview"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], VouchersController.prototype, "preview", null);
__decorate([
    (0, common_1.Get)(),
    (0, auth_decorator_1.RequirePerm)("voucher.preview"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)(new zod_pipe_1.ZodValidationPipe(voucher_schemas_1.ListVoucherQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], VouchersController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(":id/post"),
    (0, auth_decorator_1.RequirePerm)("voucher.post"),
    (0, auth_decorator_1.RequireStep)("sensitive"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Headers)("Idempotency-Key")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], VouchersController.prototype, "post", null);
__decorate([
    (0, common_1.Post)(":id/void"),
    (0, auth_decorator_1.RequirePerm)("voucher.void"),
    (0, auth_decorator_1.RequireStep)("sensitive"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Headers)("Idempotency-Key")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], VouchersController.prototype, "void", null);
exports.VouchersController = VouchersController = __decorate([
    (0, common_1.Controller)("vouchers"),
    __metadata("design:paramtypes", [vouchers_service_1.VouchersService])
], VouchersController);
//# sourceMappingURL=vouchers.controller.js.map