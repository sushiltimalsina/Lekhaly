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
exports.BankingController = void 0;
const common_1 = require("@nestjs/common");
const audit_decorator_1 = require("../../common/audit/audit.decorator");
const auth_decorator_1 = require("../../common/auth/auth.decorator");
const zod_pipe_1 = require("../../common/zod/zod.pipe");
const banking_schemas_1 = require("./dto/banking.schemas");
const banking_service_1 = require("./banking.service");
let BankingController = class BankingController {
    banking;
    constructor(banking) {
        this.banking = banking;
    }
    createBankAccount(user, body) {
        return this.banking.createBankAccount(user, body);
    }
    createStatement(user, body) {
        return this.banking.createStatement(user, body);
    }
    addStatementLine(user, id, body) {
        return this.banking.addStatementLine(user, id, body);
    }
    reconcile(user, body) {
        return this.banking.reconcile(user, body);
    }
    unmatch(user, lineId) {
        return this.banking.unmatch(user, lineId);
    }
    listStatements(user, query) {
        return this.banking.listStatements(user, query);
    }
    getStatement(user, id) {
        return this.banking.getStatement(user, id);
    }
    connectSync(user, body) {
        return this.banking.connectBankSync(user, body);
    }
    syncStatus(user) {
        return this.banking.syncStatus(user);
    }
    refreshSync(user) {
        return this.banking.refreshSync(user);
    }
};
exports.BankingController = BankingController;
__decorate([
    (0, common_1.Post)("accounts"),
    (0, auth_decorator_1.RequirePerm)("masters.write"),
    (0, auth_decorator_1.RequireStep)("sensitive"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(banking_schemas_1.CreateBankAccountSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], BankingController.prototype, "createBankAccount", null);
__decorate([
    (0, common_1.Post)("statements"),
    (0, auth_decorator_1.RequirePerm)("masters.write"),
    (0, auth_decorator_1.RequireStep)("sensitive"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(banking_schemas_1.CreateBankStatementSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], BankingController.prototype, "createStatement", null);
__decorate([
    (0, common_1.Post)("statements/:id/lines"),
    (0, auth_decorator_1.RequirePerm)("masters.write"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(banking_schemas_1.AddStatementLineSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], BankingController.prototype, "addStatementLine", null);
__decorate([
    (0, common_1.Post)("reconcile"),
    (0, auth_decorator_1.RequirePerm)("masters.write"),
    (0, auth_decorator_1.RequireStep)("sensitive"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(banking_schemas_1.ReconcileSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], BankingController.prototype, "reconcile", null);
__decorate([
    (0, common_1.Post)("reconcile/:lineId/unmatch"),
    (0, auth_decorator_1.RequirePerm)("masters.write"),
    (0, auth_decorator_1.RequireStep)("sensitive"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("lineId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BankingController.prototype, "unmatch", null);
__decorate([
    (0, common_1.Get)("statements"),
    (0, auth_decorator_1.RequirePerm)("masters.read"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)(new zod_pipe_1.ZodValidationPipe(banking_schemas_1.BankStatementListQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], BankingController.prototype, "listStatements", null);
__decorate([
    (0, common_1.Get)("statements/:id"),
    (0, auth_decorator_1.RequirePerm)("masters.read"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BankingController.prototype, "getStatement", null);
__decorate([
    (0, common_1.Post)("sync/connect"),
    (0, auth_decorator_1.RequirePerm)("settings.security"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(banking_schemas_1.BankSyncConnectSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], BankingController.prototype, "connectSync", null);
__decorate([
    (0, common_1.Get)("sync/status"),
    (0, auth_decorator_1.RequirePerm)("settings.security"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BankingController.prototype, "syncStatus", null);
__decorate([
    (0, common_1.Post)("sync/refresh"),
    (0, auth_decorator_1.RequirePerm)("settings.security"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BankingController.prototype, "refreshSync", null);
exports.BankingController = BankingController = __decorate([
    (0, common_1.Controller)("banking"),
    (0, audit_decorator_1.Audit)({ entityType: "banking", idParam: "id" }),
    __metadata("design:paramtypes", [banking_service_1.BankingService])
], BankingController);
//# sourceMappingURL=banking.controller.js.map