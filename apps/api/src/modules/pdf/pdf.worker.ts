import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class PdfWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PdfWorker.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      if (this.running) return;
      void this.process();
    }, 5000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async process(limit = 10) {
    this.running = true;
    try {
      let jobs: Array<{ id: string; type: string }> = [];
      try {
        jobs = await this.prisma.pdfJob.findMany({
          where: { status: "pending" },
          orderBy: { createdAt: "asc" },
          take: limit
        });
      } catch (err: any) {
        const message = err?.message || String(err);
        this.logger.warn(`PDF worker skipped (db unavailable): ${message}`);
        return;
      }

      for (const job of jobs) {
        try {
          await this.prisma.pdfJob.update({
            where: { id: job.id },
            data: { status: "processing" }
          });
        } catch (err: any) {
          this.logger.warn(`PDF job ${job.id} skipped (db unavailable): ${err?.message || err}`);
          continue;
        }

        try {
          // Placeholder: generate file key in object storage later.
          const resultKey = `pdf/${job.type}/${job.id}.pdf`;
          await this.prisma.pdfJob.update({
            where: { id: job.id },
            data: { status: "done", resultKey }
          });
        } catch (err: any) {
          this.logger.warn(`PDF job ${job.id} failed: ${err?.message || err}`);
          try {
            await this.prisma.pdfJob.update({
              where: { id: job.id },
              data: { status: "failed", error: err?.message || String(err) }
            });
          } catch (updateErr: any) {
            this.logger.warn(`PDF job ${job.id} failed to persist status: ${updateErr?.message || updateErr}`);
          }
        }
      }
    } catch (err: any) {
      // Never let the worker crash the process; log and retry on next tick.
      this.logger.warn(`PDF worker error: ${err?.message || String(err)}`);
    } finally {
      this.running = false;
    }
  }
}
