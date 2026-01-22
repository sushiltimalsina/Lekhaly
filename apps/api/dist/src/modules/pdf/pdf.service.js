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
exports.PdfService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let PdfService = class PdfService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createJob(user, type, payload) {
        return this.prisma.pdfJob.create({
            data: {
                companyId: user.companyId,
                type,
                payload: JSON.parse(JSON.stringify(payload))
            }
        });
    }
    async getJob(user, id) {
        const job = await this.prisma.pdfJob.findFirst({
            where: { id, companyId: user.companyId }
        });
        if (!job)
            throw new common_1.NotFoundException("PDF job not found");
        return job;
    }
    async getJobDownloadUrl(user, id) {
        const job = await this.getJob(user, id);
        if (!job.resultKey)
            throw new common_1.NotFoundException("PDF not ready");
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        const url = `https://files.local/${job.resultKey}?expires=${encodeURIComponent(expiresAt.toISOString())}`;
        return { jobId: job.id, url, expiresAt };
    }
};
exports.PdfService = PdfService;
exports.PdfService = PdfService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PdfService);
//# sourceMappingURL=pdf.service.js.map