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
exports.TaxesController = void 0;
const common_1 = require("@nestjs/common");
const audit_decorator_1 = require("../../common/audit/audit.decorator");
const auth_decorator_1 = require("../../common/auth/auth.decorator");
const zod_pipe_1 = require("../../common/zod/zod.pipe");
const tax_schemas_1 = require("./dto/tax.schemas");
const taxes_service_1 = require("./taxes.service");
let TaxesController = class TaxesController {
    taxes;
    constructor(taxes) {
        this.taxes = taxes;
    }
    list(user, query) {
        return this.taxes.list(user, query);
    }
    reorder(user, body) {
        return this.taxes.updateSortOrder(user, body);
    }
    create(user, body) {
        return this.taxes.create(user, body);
    }
    get(user, id) {
        return this.taxes.get(user, id);
    }
    update(user, id, body) {
        return this.taxes.update(user, id, body);
    }
    remove(user, id) {
        return this.taxes.remove(user, id);
    }
    vatReport(user, query) {
        return this.taxes.vatReport(user, query.from, query.to, query.fromBs, query.toBs);
    }
    vatSummary(user, query) {
        return this.taxes.vatSummary(user, query.from, query.to, query.fromBs, query.toBs);
    }
};
exports.TaxesController = TaxesController;
__decorate([
    (0, common_1.Get)(),
    (0, auth_decorator_1.RequirePerm)("settings.tax"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)(new zod_pipe_1.ZodValidationPipe(tax_schemas_1.TaxListQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TaxesController.prototype, "list", null);
__decorate([
    (0, common_1.Patch)("reorder"),
    (0, auth_decorator_1.RequirePerm)("settings.tax"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(tax_schemas_1.ReorderSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TaxesController.prototype, "reorder", null);
__decorate([
    (0, common_1.Post)(),
    (0, auth_decorator_1.RequirePerm)("settings.tax"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(tax_schemas_1.TaxCodeSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TaxesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, auth_decorator_1.RequirePerm)("settings.tax"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TaxesController.prototype, "get", null);
__decorate([
    (0, common_1.Put)(":id"),
    (0, auth_decorator_1.RequirePerm)("settings.tax"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(tax_schemas_1.TaxCodeSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], TaxesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, auth_decorator_1.RequirePerm)("settings.tax"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TaxesController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)("reports/vat"),
    (0, auth_decorator_1.RequirePerm)("reports.view"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)(new zod_pipe_1.ZodValidationPipe(tax_schemas_1.VatReportQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TaxesController.prototype, "vatReport", null);
__decorate([
    (0, common_1.Get)("reports/vat/summary"),
    (0, auth_decorator_1.RequirePerm)("reports.view"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)(new zod_pipe_1.ZodValidationPipe(tax_schemas_1.VatReportQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TaxesController.prototype, "vatSummary", null);
exports.TaxesController = TaxesController = __decorate([
    (0, common_1.Controller)("taxes"),
    (0, audit_decorator_1.Audit)({ entityType: "tax", idParam: "id" }),
    __metadata("design:paramtypes", [taxes_service_1.TaxesService])
], TaxesController);
//# sourceMappingURL=taxes.controller.js.map