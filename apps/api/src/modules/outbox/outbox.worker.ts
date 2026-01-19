import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class OutboxWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxWorkerService.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      if (this.running) return;
      void this.processPendingBatch();
    }, 5000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private nextDelay(attempts: number) {
    const baseMs = 5000;
    const factor = Math.min(attempts, 5);
    return baseMs * Math.pow(2, factor);
  }

  private async handleEvent(event: { id: string; type: string; payload: Prisma.JsonValue }) {
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
        } catch (err: any) {
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
    } finally {
      this.running = false;
    }
  }
}
