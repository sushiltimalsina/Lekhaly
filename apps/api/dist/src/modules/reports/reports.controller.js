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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const auth_decorator_1 = require("../../common/auth/auth.decorator");
const zod_pipe_1 = require("../../common/zod/zod.pipe");
const report_schemas_1 = require("./dto/report.schemas");
const reports_service_1 = require("./reports.service");
let ReportsController = class ReportsController {
    reports;
    constructor(reports) {
        this.reports = reports;
    }
    trialBalance(user, query) {
        return this.reports.trialBalance(user.companyId, query);
    }
    profitLoss(user, query) {
        return this.reports.profitAndLoss(user.companyId, query);
    }
    balanceSheet(user, query) {
        return this.reports.balanceSheet(user.companyId, query);
    }
    partyAging(user, query) {
        return this.reports.partyAging(user.companyId, query);
    }
    partyLedger(user, query) {
        return this.reports.partyLedger(user.companyId, query);
    }
    export(user, body) {
        return this.reports.exportPdf(user.companyId, body);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)("trial-balance"),
    (0, auth_decorator_1.RequirePerm)("reports.view"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)(new zod_pipe_1.ZodValidationPipe(report_schemas_1.ReportQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "trialBalance", null);
__decorate([
    (0, common_1.Get)("profit-loss"),
    (0, auth_decorator_1.RequirePerm)("reports.view"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)(new zod_pipe_1.ZodValidationPipe(report_schemas_1.ReportQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "profitLoss", null);
__decorate([
    (0, common_1.Get)("balance-sheet"),
    (0, auth_decorator_1.RequirePerm)("reports.view"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)(new zod_pipe_1.ZodValidationPipe(report_schemas_1.ReportQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "balanceSheet", null);
__decorate([
    (0, common_1.Get)("party-aging"),
    (0, auth_decorator_1.RequirePerm)("reports.view"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)(new zod_pipe_1.ZodValidationPipe(report_schemas_1.PartyAgingQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "partyAging", null);
__decorate([
    (0, common_1.Get)("ledger"),
    (0, auth_decorator_1.RequirePerm)("reports.view"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)(new zod_pipe_1.ZodValidationPipe(report_schemas_1.LedgerQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "partyLedger", null);
__decorate([
    (0, common_1.Post)("export"),
    (0, auth_decorator_1.RequirePerm)("export.pdf"),
    (0, auth_decorator_1.RequireStep)("sensitive"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(report_schemas_1.ExportReportSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "export", null);
exports.ReportsController = ReportsController = __decorate([
    (0, common_1.Controller)("reports"),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map