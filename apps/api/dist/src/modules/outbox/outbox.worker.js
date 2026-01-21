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
var OutboxWorkerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboxWorkerService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let OutboxWorkerService = OutboxWorkerService_1 = class OutboxWorkerService {
    prisma;
    logger = new common_1.Logger(OutboxWorkerService_1.name);
    timer = null;
    running = false;
    constructor(prisma) {
        this.prisma = prisma;
    }
    onModuleInit() {
        this.timer = setInterval(() => {
            if (this.running)
                return;
            void this.processPendingBatch();
        }, 5000);
    }
    onModuleDestroy() {
        if (this.timer)
            clearInterval(this.timer);
    }
    nextDelay(attempts) {
        const baseMs = 5000;
        const factor = Math.min(attempts, 5);
        return baseMs * Math.pow(2, factor);
    }
    async handleEvent(event) {
        if (event.type === "report.export") {
            return { ok: true };
        }
        throw new Error(`Unsupported outbox type: ${event.type}`);
    }
    async processPendingBatch(limit = 20) {
        this.running = true;
        try {
            const now = new Date();
            const events = await this.prisma.outboxEvent.findMany({
                where: {
                    status: "pending",
                    OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }]
                },
                orderBy: { createdAt: "asc" },
                take: limit
            });
            for (const event of events) {
                try {
                    await this.handleEvent(event);
                    await this.prisma.outboxEvent.update({
                        where: { id: event.id },
                        data: {
                            status: "processed",
                            processedAt: new Date(),
                            lastError: null
                        }
                    });
                }
                catch (err) {
                    const attempts = event.attempts + 1;
                    const maxAttempts = 5;
                    const nextAttemptAt = attempts >= maxAttempts ? null : new Date(Date.now() + this.nextDelay(attempts));
                    await this.prisma.outboxEvent.update({
                        where: { id: event.id },
                        data: {
                            attempts,
                            status: attempts >= maxAttempts ? "failed" : "pending",
                            lastError: err?.message || String(err),
                            nextAttemptAt
                        }
                    });
                    this.logger.warn(`Outbox ${event.id} failed: ${err?.message || err}`);
                }
            }
        }
        catch (err) {
            const message = err?.message || String(err);
            this.logger.warn(`Outbox worker skipped (db unavailable): ${message}`);
        }
        finally {
            this.running = false;
        }
    }
};
exports.OutboxWorkerService = OutboxWorkerService;
exports.OutboxWorkerService = OutboxWorkerService = OutboxWorkerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OutboxWorkerService);
//# sourceMappingURL=outbox.worker.js.map