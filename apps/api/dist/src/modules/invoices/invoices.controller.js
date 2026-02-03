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
exports.InvoicesController = void 0;
const common_1 = require("@nestjs/common");
const audit_decorator_1 = require("../../common/audit/audit.decorator");
const auth_decorator_1 = require("../../common/auth/auth.decorator");
const zod_pipe_1 = require("../../common/zod/zod.pipe");
const invoice_schemas_1 = require("./dto/invoice.schemas");
const invoices_service_1 = require("./invoices.service");
let InvoicesController = class InvoicesController {
    invoices;
    constructor(invoices) {
        this.invoices = invoices;
    }
    createDraft(user, body) {
        return this.invoices.createDraft(user, body);
    }
    updateDraft(user, id, body) {
        return this.invoices.updateDraft(user, id, body);
    }
    preview(user, body) {
        return this.invoices.preview(user, body);
    }
    post(user, id) {
        return this.invoices.post(user, id);
    }
    void(user, id) {
        return this.invoices.void(user, id);
    }
    list(user, query) {
        return this.invoices.list(user, query);
    }
    getById(user, id) {
        return this.invoices.getById(user, id);
    }
};
exports.InvoicesController = InvoicesController;
__decorate([
    (0, common_1.Post)("draft"),
    (0, auth_decorator_1.RequirePerm)("voucher.draft.create"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(invoice_schemas_1.CreateInvoiceDraftSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "createDraft", null);
__decorate([
    (0, common_1.Post)(":id/draft"),
    (0, auth_decorator_1.RequirePerm)("voucher.draft.update"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(invoice_schemas_1.CreateInvoiceDraftSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "updateDraft", null);
__decorate([
    (0, common_1.Post)("preview"),
    (0, auth_decorator_1.RequirePerm)("voucher.preview"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(invoice_schemas_1.CreateInvoiceDraftSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "preview", null);
__decorate([
    (0, common_1.Post)(":id/post"),
    (0, auth_decorator_1.RequirePerm)("voucher.post"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "post", null);
__decorate([
    (0, common_1.Post)(":id/void"),
    (0, auth_decorator_1.RequirePerm)("voucher.void"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "void", null);
__decorate([
    (0, common_1.Get)(),
    (0, auth_decorator_1.RequirePerm)("voucher.preview"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)(new zod_pipe_1.ZodValidationPipe(invoice_schemas_1.InvoiceListQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, auth_decorator_1.RequirePerm)("voucher.preview"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "getById", null);
exports.InvoicesController = InvoicesController = __decorate([
    (0, common_1.Controller)("invoices"),
    (0, audit_decorator_1.Audit)({ entityType: "invoice", idParam: "id" }),
    __metadata("design:paramtypes", [invoices_service_1.InvoicesService])
], InvoicesController);
//# sourceMappingURL=invoices.controller.js.map