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
exports.SyncService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let SyncService = class SyncService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async requireDeviceAccess(user, deviceId) {
        const link = await this.prisma.deviceUserLink.findFirst({
            where: { deviceId, userId: user.sub }
        });
        if (!link)
            throw new common_1.ForbiddenException("Device not linked");
        const device = await this.prisma.device.findUnique({ where: { id: deviceId } });
        if (!device || device.companyId !== user.companyId)
            throw new common_1.ForbiddenException("Device not found");
        return device;
    }
    async registerDevice(user, dto) {
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
    async pushChanges(user, dto) {
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
        const conflictSeqs = new Set([...existingSeqs, ...duplicateSeqs]);
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
            payload: e.payload,
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
    async pullChanges(user, query) {
        await this.requireDeviceAccess(user, query.deviceId);
        const where = { companyId: user.companyId };
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
};
exports.SyncService = SyncService;
exports.SyncService = SyncService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SyncService);
//# sourceMappingURL=sync.service.js.map