import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../prisma/prisma.service";
import { AUDIT_KEY, AuditMeta } from "./audit.decorator";
import type { AuthUser } from "../auth/auth.types";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService, private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest();
    const res = ctx.getResponse();

    const method = req.method as string;
    if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
      return next.handle();
    }

    const user = req.user as AuthUser | undefined;
    if (!user) return next.handle();

    const meta = this.reflector.getAllAndOverride<AuditMeta | undefined>(AUDIT_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    const entityType = meta?.entityType || req.route?.path || "api";
    const idParam = meta?.idParam || "id";
    const entityId = req.params?.[idParam] || null;
    const action = `${method} ${req.originalUrl}`;
    const requestId = req.headers["x-request-id"] as string | undefined;
    const actorDeviceId = req.headers["x-device-id"] as string | undefined;

    return next.handle().pipe(
      tap({
        next: () => {
          if (res?.statusCode && res.statusCode >= 400) return;
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
      })
    );
  }
}
