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

    const seqs = dto.entries.map((e) => e.seq);
    const uniqueSeqs = Array.from(new Set(seqs));
    const duplicateSeqs = seqs.filter((seq, idx) => seqs.indexOf(seq) !== idx);

    const existing = uniqueSeqs.length
      ? await this.prisma.changeLog.findMany({
          where: {
            deviceId: dto.deviceId,
            seq: { in: uniqueSeqs.map((s) => BigInt(s)) }
          },
          select: { id: true, seq: true, entityType: true, entityId: true }
        })
      : [];

    const existingSeqs = new Set(existing.map((e) => Number(e.seq)));
    const conflictSeqs = new Set<number>([...existingSeqs, ...duplicateSeqs]);

    const data = dto.entries
      .filter((e) => !conflictSeqs.has(e.seq))
      .map((e) => ({
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

    const result = data.length
      ? await this.prisma.changeLog.createMany({
          data,
          skipDuplicates: true
        })
      : { count: 0 };

    const conflicts = [
      ...existing.map((e) => ({
        seq: Number(e.seq),
        reason: "duplicate_seq",
        existingChangeId: e.id,
        entityType: e.entityType,
        entityId: e.entityId
      })),
      ...Array.from(new Set(duplicateSeqs)).map((seq) => ({
        seq,
        reason: "duplicate_in_batch"
      }))
    ];

    return {
      accepted: result.count,
      rejected: conflicts.length,
      conflicts
    };
  }

  async pullChanges(
    user: AuthUser,
    query: { deviceId: string; since?: Date; lastChangeId?: string; take?: number }
  ) {
    await this.requireDeviceAccess(user, query.deviceId);

    const where: any = { companyId: user.companyId };
    if (query.since) {
      where.createdAt = { gt: query.since };
    }
    if (query.lastChangeId) {
      where.id = { gt: query.lastChangeId };
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

    const normalized = entries.map((e) => ({
      ...e,
      seq: e.seq.toString()
    }));

    return { entries: normalized };
  }
}
