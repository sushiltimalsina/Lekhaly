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
    loginTotp(body) {
        return this.auth.loginTotp(body);
    }
    register(body) {
        return this.auth.register(body);
    }
    async google(query, response) {
        response.redirect(await this.auth.getGoogleAuthorizationUrl(query));
    }
    async googleCallback(query, response) {
        try {
            response.redirect(await this.auth.completeGoogleAuthorization(query));
        }
        catch (error) {
            const redirectUrl = await this.auth.getGoogleFailureRedirect(query.state, error);
            if (redirectUrl)
                return response.redirect(redirectUrl);
            throw error;
        }
    }
    async linkedIn(query, response) {
        response.redirect(await this.auth.getLinkedInAuthorizationUrl(query));
    }
    async linkedInCallback(query, response) {
        try {
            response.redirect(await this.auth.completeLinkedInAuthorization(query));
        }
        catch (error) {
            const redirectUrl = await this.auth.getLinkedInFailureRedirect(query.state, error);
            if (redirectUrl)
                return response.redirect(redirectUrl);
            throw error;
        }
    }
    async microsoft(query, response) {
        response.redirect(await this.auth.getMicrosoftAuthorizationUrl(query));
    }
    async microsoftCallback(query, response) {
        try {
            response.redirect(await this.auth.completeMicrosoftAuthorization(query));
        }
        catch (error) {
            const redirectUrl = await this.auth.getMicrosoftFailureRedirect(query.state, error);
            if (redirectUrl)
                return response.redirect(redirectUrl);
            throw error;
        }
    }
    refresh(body) {
        return this.auth.refresh(body);
    }
    logout(body) {
        return this.auth.logout(body.refreshToken);
    }
    forgotPassword(body) {
        return this.auth.requestPasswordReset(body.email);
    }
    resetPassword(body) {
        return this.auth.resetPassword({ token: body.token, password: body.password });
    }
    logoutAll(userId) {
        return this.auth.logoutAll(userId);
    }
    me(user) {
        return user;
    }
    profile(userId) {
        return this.auth.getProfile(userId);
    }
    updateProfile(userId, body) {
        return this.auth.updateProfile(userId, body);
    }
    company(userId) {
        return this.auth.getCompany(userId);
    }
    updateCompany(userId, body) {
        return this.auth.updateCompany(userId, body);
    }
    completeCompanyOnboarding(userId, body) {
        return this.auth.completeCompanyOnboarding(userId, body);
    }
    updateNotifications(userId, body) {
        return this.auth.updateNotifications(userId, body);
    }
    billingPortal(userId) {
        return this.auth.startBillingPortal(userId);
    }
    totpStatus(userId) {
        return this.auth.totpStatus(userId);
    }
    setup(userId) {
        return this.auth.totpSetup(userId);
    }
    enable(userId, body) {
        return this.auth.totpEnable(userId, body.code);
    }
    regenerateTotpRecoveryCodes(userId, body) {
        return this.auth.regenerateTotpRecoveryCodes(userId, body);
    }
    verifyTotpRecoveryPassword(userId, body) {
        return this.auth.verifyTotpRecoveryPassword(userId, body.password);
    }
    disableTotp(userId, body) {
        return this.auth.totpDisable(userId, body);
    }
    verifyTotpDisablePassword(userId, body) {
        return this.auth.verifyTotpDisablePassword(userId, body.password);
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
    (0, common_1.Post)("login/totp"),
    (0, auth_decorator_1.Public)(),
    (0, common_1.UsePipes)(new zod_pipe_1.ZodValidationPipe(auth_schemas_1.LoginTotpSchema)),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "loginTotp", null);
__decorate([
    (0, common_1.Post)("register"),
    (0, auth_decorator_1.Public)(),
    __param(0, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(auth_schemas_1.RegisterSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Get)("google"),
    (0, auth_decorator_1.Public)(),
    __param(0, (0, common_1.Query)(new zod_pipe_1.ZodValidationPipe(auth_schemas_1.GoogleAuthStartSchema))),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "google", null);
__decorate([
    (0, common_1.Get)("google/callback"),
    (0, auth_decorator_1.Public)(),
    __param(0, (0, common_1.Query)(new zod_pipe_1.ZodValidationPipe(auth_schemas_1.GoogleAuthCallbackSchema))),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleCallback", null);
__decorate([
    (0, common_1.Get)("linkedin"),
    (0, auth_decorator_1.Public)(),
    __param(0, (0, common_1.Query)(new zod_pipe_1.ZodValidationPipe(auth_schemas_1.LinkedInAuthStartSchema))),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "linkedIn", null);
__decorate([
    (0, common_1.Get)("linkedin/callback"),
    (0, auth_decorator_1.Public)(),
    __param(0, (0, common_1.Query)(new zod_pipe_1.ZodValidationPipe(auth_schemas_1.LinkedInAuthCallbackSchema))),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "linkedInCallback", null);
__decorate([
    (0, common_1.Get)("microsoft"),
    (0, auth_decorator_1.Public)(),
    __param(0, (0, common_1.Query)(new zod_pipe_1.ZodValidationPipe(auth_schemas_1.MicrosoftAuthStartSchema))),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "microsoft", null);
__decorate([
    (0, common_1.Get)("microsoft/callback"),
    (0, auth_decorator_1.Public)(),
    __param(0, (0, common_1.Query)(new zod_pipe_1.ZodValidationPipe(auth_schemas_1.MicrosoftAuthCallbackSchema))),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "microsoftCallback", null);
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
    (0, common_1.Post)("forgot-password"),
    (0, auth_decorator_1.Public)(),
    (0, common_1.UsePipes)(new zod_pipe_1.ZodValidationPipe(auth_schemas_1.ForgotPasswordSchema)),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)("reset-password"),
    (0, auth_decorator_1.Public)(),
    (0, common_1.UsePipes)(new zod_pipe_1.ZodValidationPipe(auth_schemas_1.ResetPasswordSchema)),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Post)("logout-all"),
    __param(0, (0, auth_decorator_1.CurrentUser)("sub")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "logoutAll", null);
__decorate([
    (0, common_1.Get)("me"),
    __param(0, (0, auth_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "me", null);
__decorate([
    (0, common_1.Get)("profile"),
    __param(0, (0, auth_decorator_1.CurrentUser)("sub")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "profile", null);
__decorate([
    (0, common_1.Patch)("profile"),
    __param(0, (0, auth_decorator_1.CurrentUser)("sub")),
    __param(1, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(auth_schemas_1.ProfileSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Get)("company"),
    __param(0, (0, auth_decorator_1.CurrentUser)("sub")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "company", null);
__decorate([
    (0, common_1.Patch)("company"),
    __param(0, (0, auth_decorator_1.CurrentUser)("sub")),
    __param(1, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(auth_schemas_1.CompanySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "updateCompany", null);
__decorate([
    (0, common_1.Post)("company/complete-onboarding"),
    __param(0, (0, auth_decorator_1.CurrentUser)("sub")),
    __param(1, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(auth_schemas_1.CompanySchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "completeCompanyOnboarding", null);
__decorate([
    (0, common_1.Patch)("notifications"),
    __param(0, (0, auth_decorator_1.CurrentUser)("sub")),
    __param(1, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(auth_schemas_1.NotificationsSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "updateNotifications", null);
__decorate([
    (0, common_1.Post)("billing/portal"),
    __param(0, (0, auth_decorator_1.CurrentUser)("sub")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "billingPortal", null);
__decorate([
    (0, common_1.Get)("totp/status"),
    __param(0, (0, auth_decorator_1.CurrentUser)("sub")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "totpStatus", null);
__decorate([
    (0, common_1.Post)("totp/setup"),
    __param(0, (0, auth_decorator_1.CurrentUser)("sub")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "setup", null);
__decorate([
    (0, common_1.Post)("totp/enable"),
    __param(0, (0, auth_decorator_1.CurrentUser)("sub")),
    __param(1, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(auth_schemas_1.TotpEnableSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "enable", null);
__decorate([
    (0, common_1.Post)("totp/recovery-codes/regenerate"),
    __param(0, (0, auth_decorator_1.CurrentUser)("sub")),
    __param(1, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(auth_schemas_1.TotpRecoveryRegenerateSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "regenerateTotpRecoveryCodes", null);
__decorate([
    (0, common_1.Post)("totp/recovery-codes/verify-password"),
    __param(0, (0, auth_decorator_1.CurrentUser)("sub")),
    __param(1, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(auth_schemas_1.TotpRecoveryRegeneratePasswordSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verifyTotpRecoveryPassword", null);
__decorate([
    (0, common_1.Post)("totp/disable"),
    __param(0, (0, auth_decorator_1.CurrentUser)("sub")),
    __param(1, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(auth_schemas_1.TotpDisableSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "disableTotp", null);
__decorate([
    (0, common_1.Post)("totp/disable/verify-password"),
    __param(0, (0, auth_decorator_1.CurrentUser)("sub")),
    __param(1, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(auth_schemas_1.TotpDisablePasswordSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verifyTotpDisablePassword", null);
__decorate([
    (0, common_1.Post)("step-up"),
    __param(0, (0, auth_decorator_1.CurrentUser)("sub")),
    __param(1, (0, common_1.Body)(new zod_pipe_1.ZodValidationPipe(auth_schemas_1.StepUpSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "stepUp", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)("auth"),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map