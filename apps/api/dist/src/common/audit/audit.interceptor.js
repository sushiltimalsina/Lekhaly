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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditInterceptor = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_decorator_1 = require("./audit.decorator");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const crypto_1 = __importDefault(require("crypto"));
let AuditInterceptor = class AuditInterceptor {
    prisma;
    reflector;
    constructor(prisma, reflector) {
        this.prisma = prisma;
        this.reflector = reflector;
    }
    async snapshot(entityType, entityId, data) {
        const json = JSON.parse(JSON.stringify(data));
        const hash = crypto_1.default.createHash("sha256").update(JSON.stringify(json)).digest("hex");
        return this.prisma.auditSnapshot.create({
            data: {
                companyId: json.companyId || "",
                entityType,
                entityId,
                snapshotJson: json,
                hash
            }
        });
    }
    async fetchEntity(entityType, entityId) {
        switch (entityType) {
            case "voucher":
                return this.prisma.voucher.findUnique({ where: { id: entityId }, include: { lines: true } });
            case "party":
                return this.prisma.party.findUnique({ where: { id: entityId } });
            case "item":
                return this.prisma.item.findUnique({ where: { id: entityId } });
            case "account":
                return this.prisma.chartOfAccount.findUnique({ where: { id: entityId } });
            case "tax":
                return this.prisma.taxCode.findUnique({ where: { id: entityId } });
            default:
                return null;
        }
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
        const requestEntityId = req.params?.[idParam] || null;
        const action = `${method} ${req.originalUrl}`;
        const requestId = req.headers["x-request-id"];
        const actorDeviceId = req.headers["x-device-id"];
        const beforePromise = requestEntityId ? this.fetchEntity(entityType, requestEntityId) : Promise.resolve(null);
        return next.handle().pipe((0, operators_1.mergeMap)((data) => (0, rxjs_1.from)((async () => {
            if (res?.statusCode && res.statusCode >= 400)
                return data;
            let entityId = requestEntityId;
            if (!entityId && data && typeof data === "object") {
                const maybeId = data.id;
                const voidedId = data.voidedVoucherId;
                if (typeof maybeId === "string")
                    entityId = maybeId;
                if (!entityId && typeof voidedId === "string")
                    entityId = voidedId;
            }
            const before = await beforePromise;
            const after = entityId ? await this.fetchEntity(entityType, entityId) : data && typeof data === "object" ? data : null;
            const beforeSnap = before
                ? await this.snapshot(entityType, entityId, { ...before, companyId: user.companyId })
                : null;
            const afterSnap = after && entityId
                ? await this.snapshot(entityType, entityId, { ...after, companyId: user.companyId })
                : null;
            await this.prisma.auditLog.create({
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
                    userAgent: req.headers["user-agent"] || null,
                    beforeSnapshotId: beforeSnap?.id,
                    afterSnapshotId: afterSnap?.id
                }
            });
            return data;
        })())));
    }
};
exports.AuditInterceptor = AuditInterceptor;
exports.AuditInterceptor = AuditInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, core_1.Reflector])
], AuditInterceptor);
//# sourceMappingURL=audit.interceptor.js.map