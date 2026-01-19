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
exports.OutboxService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let OutboxService = class OutboxService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(user, filters) {
        const where = { companyId: user.companyId };
        if (filters.status)
            where.status = filters.status;
        if (filters.type)
            where.type = { contains: filters.type, mode: "insensitive" };
        return this.prisma.outboxEvent.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: filters.skip || 0,
            take: filters.take || 50
        });
    }
    async ack(user, id, input) {
        const event = await this.prisma.outboxEvent.findFirst({
            where: { id, companyId: user.companyId }
        });
        if (!event)
            throw new common_1.NotFoundException("Outbox event not found");
        return this.prisma.outboxEvent.update({
            where: { id: event.id },
            data: {
                status: input.status,
                lastError: input.lastError || null,
                processedAt: input.status === "processed" ? new Date() : null,
                nextAttemptAt: input.status === "processed" ? null : event.nextAttemptAt
            }
        });
    }
    async enqueue(companyId, type, payload) {
        return this.prisma.outboxEvent.create({
            data: {
                companyId,
                type,
                payload
            }
        });
    }
};
exports.OutboxService = OutboxService;
exports.OutboxService = OutboxService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OutboxService);
//# sourceMappingURL=outbox.service.js.map