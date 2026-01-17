"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const audit_interceptor_1 = require("./common/audit/audit.interceptor");
const prisma_module_1 = require("./common/prisma/prisma.module");
const auth_module_1 = require("./modules/auth/auth.module");
const reports_module_1 = require("./modules/reports/reports.module");
const sync_module_1 = require("./modules/sync/sync.module");
const vouchers_module_1 = require("./modules/vouchers/vouchers.module");
const health_module_1 = require("./moduls/health/health.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, health_module_1.HealthModule, auth_module_1.AuthModule, reports_module_1.ReportsModule, vouchers_module_1.VouchersModule, sync_module_1.SyncModule],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService, { provide: core_1.APP_INTERCEPTOR, useClass: audit_interceptor_1.AuditInterceptor }]
    })
], AppModule);
//# sourceMappingURL=app.module.js.map