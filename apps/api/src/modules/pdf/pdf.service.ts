import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";

@Injectable()
export class PdfService {
  constructor(private prisma: PrismaService) {}

  async createJob(user: AuthUser, type: string, payload: Record<string, unknown>) {
    return this.prisma.pdfJob.create({
      data: {
        companyId: user.companyId,
        type,
        payload: JSON.parse(JSON.stringify(payload))
      }
    });
  }

  async getJob(user: AuthUser, id: string) {
    const job = await this.prisma.pdfJob.findFirst({
      where: { id, companyId: user.companyId }
    });
    if (!job) throw new NotFoundException("PDF job not found");
    return job;
  }
}
