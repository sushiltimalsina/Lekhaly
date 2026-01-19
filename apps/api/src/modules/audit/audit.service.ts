import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  private toCsv(rows: Array<Record<string, unknown>>) {
    if (rows.length === 0) return "";
    const headers = Object.keys(rows[0]);
    const escape = (value: unknown) => {
      if (value === null || value === undefined) return "";
      const text = String(value);
      if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
        return `"${text.replace(/\"/g, "\"\"")}"`;
      }
      return text;
    };
    const lines = [headers.join(",")];
    for (const row of rows) {
      lines.push(headers.map((key) => escape(row[key])).join(","));
    }
    return lines.join("\n");
  }

  async list(
    user: AuthUser,
    filters: {
      entityType?: string;
      entityId?: string;
      actorUserId?: string;
      actorDeviceId?: string;
      q?: string;
      from?: Date;
      to?: Date;
      cursorId?: string;
      cursorCreatedAt?: Date;
      skip?: number;
      take?: number;
    }
  ) {
    const where: Prisma.AuditLogWhereInput = { companyId: user.companyId };
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.actorUserId) where.actorUserId = filters.actorUserId;
    if (filters.actorDeviceId) where.actorDeviceId = filters.actorDeviceId;
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) (where.createdAt as Prisma.DateTimeFilter).gte = filters.from;
      if (filters.to) (where.createdAt as Prisma.DateTimeFilter).lte = filters.to;
    }
    if (filters.q) {
      where.OR = [
        { action: { contains: filters.q, mode: "insensitive" } },
        { entityType: { contains: filters.q, mode: "insensitive" } },
        { entityId: { contains: filters.q, mode: "insensitive" } },
        { ip: { contains: filters.q, mode: "insensitive" } },
        { userAgent: { contains: filters.q, mode: "insensitive" } },
        { actorUser: { email: { contains: filters.q, mode: "insensitive" } } },
        { actorUser: { name: { contains: filters.q, mode: "insensitive" } } },
        { actorDevice: { label: { contains: filters.q, mode: "insensitive" } } },
        { actorDevice: { platform: { contains: filters.q, mode: "insensitive" } } }
      ];
    }
    if (filters.cursorId && filters.cursorCreatedAt) {
      where.AND = [
        {
          OR: [
            { createdAt: { lt: filters.cursorCreatedAt } },
            { createdAt: filters.cursorCreatedAt, id: { lt: filters.cursorId } }
          ]
        }
      ];
    }

    const take = filters.take || 50;
    const rows = await this.prisma.auditLog.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: filters.cursorId ? 0 : filters.skip || 0,
      take,
      include: {
        actorUser: { select: { id: true, email: true, name: true } },
        actorDevice: { select: { id: true, label: true, platform: true } }
      }
    });
    const last = rows[rows.length - 1];
    const nextCursor = last
      ? { cursorId: last.id, cursorCreatedAt: last.createdAt }
      : null;

    return {
      rows,
      nextCursor
    };
  }

  async exportCsv(
    user: AuthUser,
    filters: {
      entityType?: string;
      entityId?: string;
      actorUserId?: string;
      actorDeviceId?: string;
      q?: string;
      from?: Date;
      to?: Date;
    }
  ) {
    const result = await this.list(user, { ...filters, skip: 0, take: 1000 });
    const normalized = result.rows.map((row) => ({
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      action: row.action,
      entityType: row.entityType,
      entityId: row.entityId,
      actorType: row.actorType,
      actorUserId: row.actorUserId || "",
      actorUserEmail: row.actorUser?.email || "",
      actorUserName: row.actorUser?.name || "",
      actorDeviceId: row.actorDeviceId || "",
      actorDeviceLabel: row.actorDevice?.label || "",
      actorDevicePlatform: row.actorDevice?.platform || "",
      ip: row.ip || "",
      userAgent: row.userAgent || "",
      requestId: row.requestId || ""
    }));

    const csv = this.toCsv(normalized);
    const contentBase64 = Buffer.from(csv, "utf8").toString("base64");
    const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const fileName = `audit-${dateStamp}.csv`;

    return {
      format: "csv",
      fileName,
      contentType: "text/csv",
      contentBase64
    };
  }
}
