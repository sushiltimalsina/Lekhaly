import { ForbiddenException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";

@Injectable()
export class SyncService {
  constructor(private prisma: PrismaService) {}

  private async requireDeviceAccess(user: AuthUser, deviceId: string) {
    const link = await this.prisma.deviceUserLink.findFirst({
      where: { deviceId, userId: user.sub }
    });
    if (!link) throw new ForbiddenException("Device not linked");

    const device = await this.prisma.device.findUnique({ where: { id: deviceId } });
    if (!device || device.companyId !== user.companyId) throw new ForbiddenException("Device not found");
    return device;
  }

  async registerDevice(user: AuthUser, dto: { label: string; platform: string }) {
    const device = await this.prisma.device.create({
      data: {
        companyId: user.companyId,
        label: dto.label,
        platform: dto.platform,
        trusted: false
      }
    });

    await this.prisma.deviceUserLink.create({
      data: { deviceId: device.id, userId: user.sub }
    });

    await this.prisma.syncState.create({
      data: {
        companyId: user.companyId,
        deviceId: device.id
      }
    });

    return { deviceId: device.id };
  }

  async pushChanges(
    user: AuthUser,
    dto: {
      deviceId: string;
      entries: Array<{
        seq: number;
        entityType: string;
        entityId: string;
        op: "upsert" | "delete" | "command";
      payload: Prisma.InputJsonValue;
        idempotencyKey?: string;
      }>;
    }
  ) {
    await this.requireDeviceAccess(user, dto.deviceId);

    const data = dto.entries.map((e) => ({
      companyId: user.companyId,
      deviceId: dto.deviceId,
      actorUserId: user.sub,
      seq: BigInt(e.seq),
      entityType: e.entityType,
      entityId: e.entityId,
      op: e.op,
      payload: e.payload as Prisma.InputJsonValue,
      idempotencyKey: e.idempotencyKey || null
    }));

    const result = await this.prisma.changeLog.createMany({
      data,
      skipDuplicates: true
    });

    return { accepted: result.count };
  }

  async pullChanges(user: AuthUser, query: { deviceId: string; since?: Date; take?: number }) {
    await this.requireDeviceAccess(user, query.deviceId);

    const where: any = { companyId: user.companyId };
    if (query.since) {
      where.createdAt = { gt: query.since };
    }

    const entries = await this.prisma.changeLog.findMany({
      where,
      orderBy: { createdAt: "asc" },
      take: query.take || 200
    });

    const last = entries[entries.length - 1];
    if (last) {
      await this.prisma.syncState.update({
        where: { deviceId: query.deviceId },
        data: { lastPulledChangeId: last.id }
      });
    }

    return { entries };
  }
}
