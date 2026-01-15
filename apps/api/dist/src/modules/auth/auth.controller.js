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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_decorator_1 = require("../../common/auth/auth.decorator");
const zod_pipe_1 = require("../../common/zod/zod.pipe");
const auth_schemas_1 = require("./dto/auth.schemas");
const auth_service_1 = require("./auth.service");
let AuthController = class AuthController {
    auth;
    constructor(auth) {
        this.auth = auth;
    }
    login(body) {
        return this.auth.login(body);
    }
    refresh(body) {
        return this.auth.refresh(body);
    }
    logout(body) {
        return this.auth.logout(body.refreshToken);
    }
    setup(userId) {
        return this.auth.totpSetup(userId);
    }
    enable(userId, body) {
        return this.auth.totpEnable(userId, body.code);
    }
    stepUp(userId, body) {
        return this.auth.stepUp(userId, body.code);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)("login"),
    (0, auth_decorator_1.Public)(),
    (0, common_1.UsePipes)(new zod_pipe_1.ZodValidationPipe(auth_schemas_1.LoginSchema)),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)("refresh"),
    (0, auth_decorator_1.Public)(),
    (0, common_1.UsePipes)(new zod_pipe_1.ZodValidationPipe(auth_schemas_1.RefreshSchema)),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)("logout"),
    (0, auth_decorator_1.Public)(),
    (0, common_1.UsePipes)(new zod_pipe_1.ZodValidationPipe(auth_schemas_1.RefreshSchema)),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)("totp/setup"),
    __param(0, (0, auth_decorator_1.CurrentUser)("sub")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "setup", null);
__decorate([
    (0, common_1.Post)("totp/enable"),
    (0, auth_decorator_1.RequirePerm)("settings.security"),
    (0, common_1.UsePipes)(new zod_pipe_1.ZodValidationPipe(auth_schemas_1.TotpEnableSchema)),
    __param(0, (0, auth_decorator_1.CurrentUser)("sub")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "enable", null);
__decorate([
    (0, common_1.Post)("step-up"),
    (0, common_1.UsePipes)(new zod_pipe_1.ZodValidationPipe(auth_schemas_1.StepUpSchema)),
    __param(0, (0, auth_decorator_1.CurrentUser)("sub")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "stepUp", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)("auth"),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map