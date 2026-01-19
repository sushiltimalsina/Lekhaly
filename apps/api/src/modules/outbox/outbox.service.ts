import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";

@Injectable()
export class OutboxService {
  constructor(private prisma: PrismaService) {}

  async list(
    user: AuthUser,
    filters: { status?: "pending" | "processed" | "failed"; type?: string; skip?: number; take?: number }
  ) {
    const where: Prisma.OutboxEventWhereInput = { companyId: user.companyId };
    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = { contains: filters.type, mode: "insensitive" };

    return this.prisma.outboxEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: filters.skip || 0,
      take: filters.take || 50
    });
  }

  async ack(
    user: AuthUser,
    id: string,
    input: { status: "processed" | "failed"; lastError?: string }
  ) {
    const event = await this.prisma.outboxEvent.findFirst({
      where: { id, companyId: user.companyId }
    });
    if (!event) throw new NotFoundException("Outbox event not found");

    return this.prisma.outboxEvent.update({
      where: { id: event.id },
      data: {
        status: input.status,
        lastError: input.lastError || null,
        processedAt: input.status === "processed" ? new Date() : null
      }
    });
  }

  async enqueue(companyId: string, type: string, payload: Prisma.InputJsonValue) {
    return this.prisma.outboxEvent.create({
      data: {
        companyId,
        type,
        payload
      }
    });
  }
}
