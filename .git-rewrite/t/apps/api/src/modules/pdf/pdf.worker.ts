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
      const jobs = await this.prisma.pdfJob.findMany({
        where: { status: "pending" },
        orderBy: { createdAt: "asc" },
        take: limit
      });

      for (const job of jobs) {
        await this.prisma.pdfJob.update({
          where: { id: job.id },
          data: { status: "processing" }
        });

        try {
          // Placeholder: generate file key in object storage later.
          const resultKey = `pdf/${job.type}/${job.id}.pdf`;
          await this.prisma.pdfJob.update({
            where: { id: job.id },
            data: { status: "done", resultKey }
          });
        } catch (err: any) {
          this.logger.warn(`PDF job ${job.id} failed: ${err?.message || err}`);
          await this.prisma.pdfJob.update({
            where: { id: job.id },
            data: { status: "failed", error: err?.message || String(err) }
          });
        }
      }
    } finally {
      this.running = false;
    }
  }
}
