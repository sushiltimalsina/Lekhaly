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
var PdfWorker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfWorker = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let PdfWorker = PdfWorker_1 = class PdfWorker {
    prisma;
    logger = new common_1.Logger(PdfWorker_1.name);
    timer = null;
    running = false;
    constructor(prisma) {
        this.prisma = prisma;
    }
    onModuleInit() {
        this.timer = setInterval(() => {
            if (this.running)
                return;
            void this.process();
        }, 5000);
    }
    onModuleDestroy() {
        if (this.timer)
            clearInterval(this.timer);
    }
    async process(limit = 10) {
        this.running = true;
        try {
            let jobs = [];
            try {
                jobs = await this.prisma.pdfJob.findMany({
                    where: { status: "pending" },
                    orderBy: { createdAt: "asc" },
                    take: limit
                });
            }
            catch (err) {
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
                }
                catch (err) {
                    this.logger.warn(`PDF job ${job.id} skipped (db unavailable): ${err?.message || err}`);
                    continue;
                }
                try {
                    const resultKey = `pdf/${job.type}/${job.id}.pdf`;
                    await this.prisma.pdfJob.update({
                        where: { id: job.id },
                        data: { status: "done", resultKey }
                    });
                }
                catch (err) {
                    this.logger.warn(`PDF job ${job.id} failed: ${err?.message || err}`);
                    try {
                        await this.prisma.pdfJob.update({
                            where: { id: job.id },
                            data: { status: "failed", error: err?.message || String(err) }
                        });
                    }
                    catch (updateErr) {
                        this.logger.warn(`PDF job ${job.id} failed to persist status: ${updateErr?.message || updateErr}`);
                    }
                }
            }
        }
        catch (err) {
            this.logger.warn(`PDF worker error: ${err?.message || String(err)}`);
        }
        finally {
            this.running = false;
        }
    }
};
exports.PdfWorker = PdfWorker;
exports.PdfWorker = PdfWorker = PdfWorker_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PdfWorker);
//# sourceMappingURL=pdf.worker.js.map