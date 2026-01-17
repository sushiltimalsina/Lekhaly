import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

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

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: filters.skip || 0,
      take: filters.take || 50,
      include: {
        actorUser: { select: { id: true, email: true, name: true } },
        actorDevice: { select: { id: true, label: true, platform: true } }
      }
    });
  }
}
