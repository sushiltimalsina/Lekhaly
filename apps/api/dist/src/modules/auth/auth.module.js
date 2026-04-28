"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const jwt_1 = require("@nestjs/jwt");
const jwt_auth_guard_1 = require("../../common/auth/jwt-auth.guard");
const permissions_guard_1 = require("../../common/auth/permissions.guard");
const step_guard_1 = require("../../common/auth/step.guard");
const auth_controller_1 = require("./auth.controller");
const auth_controller_v1_1 = require("./auth.controller.v1");
const auth_service_1 = require("./auth.service");
const fiscal_sessions_module_1 = require("../fiscal-sessions/fiscal-sessions.module");
const accounts_module_1 = require("../accounts/accounts.module");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            jwt_1.JwtModule.register({
                secret: process.env.JWT_ACCESS_SECRET || "dev-secret",
                signOptions: (() => {
                    const issuer = process.env.JWT_ISSUER;
                    const audience = process.env.JWT_AUDIENCE;
                    const options = { expiresIn: 86400 };
                    if (issuer)
                        options.issuer = issuer;
                    if (audience)
                        options.audience = audience;
                    return options;
                })()
            }),
            fiscal_sessions_module_1.FiscalSessionsModule,
            accounts_module_1.AccountsModule,
        ],
        controllers: [auth_controller_1.AuthController, auth_controller_v1_1.AuthV1Controller],
        providers: [
            auth_service_1.AuthService,
            { provide: core_1.APP_GUARD, useClass: jwt_auth_guard_1.JwtAuthGuard },
            { provide: core_1.APP_GUARD, useClass: permissions_guard_1.PermissionsGuard },
            { provide: core_1.APP_GUARD, useClass: step_guard_1.StepUpGuard }
        ]
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map