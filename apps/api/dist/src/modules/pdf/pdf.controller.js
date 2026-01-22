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
exports.PdfController = void 0;
const common_1 = require("@nestjs/common");
const audit_decorator_1 = require("../../common/audit/audit.decorator");
const auth_decorator_1 = require("../../common/auth/auth.decorator");
const zod_pipe_1 = require("../../common/zod/zod.pipe");
const pdf_schemas_1 = require("./dto/pdf.schemas");
const pdf_service_1 = require("./pdf.service");
let PdfController = class PdfController {
    pdf;
    constructor(pdf) {
        this.pdf = pdf;
    }
    createInvoiceJob(user, invoiceId) {
        return this.pdf.createJob(user, "invoice", { invoiceId });
    }
    createVoucherJob(user, voucherId) {
        return this.pdf.createJob(user, "voucher", { voucherId });
    }
    createLedgerJob(user, body) {
        return this.pdf.createJob(user, "ledger", body);
    }
    getJob(user, id) {
        return this.pdf.getJob(user, id);
    }
    getJobUrl(user, id) {
        return this.pdf.getJobDownloadUrl(user, id);
    }
};
exports.PdfController = PdfController;
__decorate([
    (0, common_1.Post)("invoice/:invoiceId"),
    (0, auth_decorator_1.RequirePerm)("export.pdf"),
    (0, auth_decorator_1.RequireStep)("sensitive"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("invoiceId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PdfController.prototype, "createInvoiceJob", null);
__decorate([
    (0, common_1.Post)("voucher/:voucherId"),
    (0, auth_decorator_1.RequirePerm)("export.pdf"),
    (0, auth_decorator_1.RequireStep)("sensitive"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("voucherId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PdfController.prototype, "createVoucherJob", null);
__decorate([
    (0, common_1.Post)("ledger"),
    (0, auth_decorator_1.RequirePerm)("export.pdf"),
    (0, auth_decorator_1.RequireStep)("sensitive"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(pdf_schemas_1.PdfLedgerSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PdfController.prototype, "createLedgerJob", null);
__decorate([
    (0, common_1.Get)("jobs/:id"),
    (0, auth_decorator_1.RequirePerm)("export.pdf"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PdfController.prototype, "getJob", null);
__decorate([
    (0, common_1.Get)("jobs/:id/url"),
    (0, auth_decorator_1.RequirePerm)("export.pdf"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PdfController.prototype, "getJobUrl", null);
exports.PdfController = PdfController = __decorate([
    (0, common_1.Controller)("pdf"),
    (0, audit_decorator_1.Audit)({ entityType: "pdf", idParam: "id" }),
    __metadata("design:paramtypes", [pdf_service_1.PdfService])
], PdfController);
//# sourceMappingURL=pdf.controller.js.map