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
exports.ExpensesController = void 0;
const common_1 = require("@nestjs/common");
const audit_decorator_1 = require("../../common/audit/audit.decorator");
const auth_decorator_1 = require("../../common/auth/auth.decorator");
const zod_pipe_1 = require("../../common/zod/zod.pipe");
const expenses_schemas_1 = require("./dto/expenses.schemas");
const expenses_service_1 = require("./expenses.service");
let ExpensesController = class ExpensesController {
    expenses;
    constructor(expenses) {
        this.expenses = expenses;
    }
    createDraft(user, body) {
        return this.expenses.createDraft(user, body);
    }
    preview(user, body) {
        return this.expenses.preview(user, body);
    }
    post(user, id, body) {
        return this.expenses.post(user, id, body);
    }
    list(user, query) {
        return this.expenses.list(user, query);
    }
};
exports.ExpensesController = ExpensesController;
__decorate([
    (0, common_1.Post)("draft"),
    (0, auth_decorator_1.RequirePerm)("voucher.draft.create"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(expenses_schemas_1.ExpenseDraftSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ExpensesController.prototype, "createDraft", null);
__decorate([
    (0, common_1.Post)("preview"),
    (0, auth_decorator_1.RequirePerm)("voucher.preview"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(expenses_schemas_1.ExpenseDraftSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ExpensesController.prototype, "preview", null);
__decorate([
    (0, common_1.Post)(":id/post"),
    (0, auth_decorator_1.RequirePerm)("voucher.post"),
    (0, auth_decorator_1.RequireStep)("sensitive"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(expenses_schemas_1.ExpenseDraftSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], ExpensesController.prototype, "post", null);
__decorate([
    (0, common_1.Get)(),
    (0, auth_decorator_1.RequirePerm)("voucher.preview"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)(new zod_pipe_1.ZodValidationPipe(expenses_schemas_1.ExpenseListQuerySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ExpensesController.prototype, "list", null);
exports.ExpensesController = ExpensesController = __decorate([
    (0, common_1.Controller)("expenses"),
    (0, audit_decorator_1.Audit)({ entityType: "expense", idParam: "id" }),
    __metadata("design:paramtypes", [expenses_service_1.ExpensesService])
], ExpensesController);
//# sourceMappingURL=expenses.controller.js.map