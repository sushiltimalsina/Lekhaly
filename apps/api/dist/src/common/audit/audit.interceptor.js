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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditInterceptor = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_decorator_1 = require("./audit.decorator");
const operators_1 = require("rxjs/operators");
let AuditInterceptor = class AuditInterceptor {
    prisma;
    reflector;
    constructor(prisma, reflector) {
        this.prisma = prisma;
        this.reflector = reflector;
    }
    intercept(context, next) {
        const ctx = context.switchToHttp();
        const req = ctx.getRequest();
        const res = ctx.getResponse();
        const method = req.method;
        if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
            return next.handle();
        }
        const user = req.user;
        if (!user)
            return next.handle();
        const meta = this.reflector.getAllAndOverride(audit_decorator_1.AUDIT_KEY, [
            context.getHandler(),
            context.getClass()
        ]);
        const entityType = meta?.entityType || req.route?.path || "api";
        const idParam = meta?.idParam || "id";
        const entityId = req.params?.[idParam] || null;
        const action = `${method} ${req.originalUrl}`;
        const requestId = req.headers["x-request-id"];
        const actorDeviceId = req.headers["x-device-id"];
        return next.handle().pipe((0, operators_1.tap)({
            next: () => {
                if (res?.statusCode && res.statusCode >= 400)
                    return;
                void this.prisma.auditLog.create({
                    data: {
                        companyId: user.companyId,
                        actorType: "user",
                        actorUserId: user.sub,
                        actorDeviceId: actorDeviceId || null,
                        action,
                        entityType,
                        entityId: entityId || "unknown",
                        requestId: requestId || null,
                        ip: req.ip || null,
                        userAgent: req.headers["user-agent"] || null
                    }
                });
            }
        }));
    }
};
exports.AuditInterceptor = AuditInterceptor;
exports.AuditInterceptor = AuditInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, core_1.Reflector])
], AuditInterceptor);
//# sourceMappingURL=audit.interceptor.js.map