import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AUDIT_KEY, AuditMeta } from "./audit.decorator";
import type { AuthUser } from "../auth/auth.types";
import { Observable, from } from "rxjs";
import { mergeMap } from "rxjs/operators";
import crypto from "crypto";

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService, private reflector: Reflector) {}

  private async snapshot(entityType: string, entityId: string, data: unknown) {
    const json = JSON.parse(JSON.stringify(data)) as Prisma.InputJsonValue;
    const hash = crypto.createHash("sha256").update(JSON.stringify(json)).digest("hex");
    return this.prisma.auditSnapshot.create({
      data: {
        companyId: (json as any).companyId || "",
        entityType,
        entityId,
        snapshotJson: json,
        hash
      }
    });
  }

  private async fetchEntity(entityType: string, entityId: string) {
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
    const requestEntityId = req.params?.[idParam] || null;
    const action = `${method} ${req.originalUrl}`;
    const requestId = req.headers["x-request-id"] as string | undefined;
    const actorDeviceId = req.headers["x-device-id"] as string | undefined;
    const beforePromise = requestEntityId ? this.fetchEntity(entityType, requestEntityId) : Promise.resolve(null);

    return next.handle().pipe(
      mergeMap((data) =>
        from(
          (async () => {
            if (res?.statusCode && res.statusCode >= 400) return data;

            let entityId = requestEntityId as string | null;
            if (!entityId && data && typeof data === "object") {
              const maybeId = (data as Record<string, unknown>).id;
              const voidedId = (data as Record<string, unknown>).voidedVoucherId;
              if (typeof maybeId === "string") entityId = maybeId;
              if (!entityId && typeof voidedId === "string") entityId = voidedId;
            }

            const before = await beforePromise;
            const after =
              entityId ? await this.fetchEntity(entityType, entityId) : data && typeof data === "object" ? data : null;

            const beforeSnap = before
              ? await this.snapshot(entityType, entityId as string, { ...before, companyId: user.companyId })
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
          })()
        )
      )
    );
  }
}
