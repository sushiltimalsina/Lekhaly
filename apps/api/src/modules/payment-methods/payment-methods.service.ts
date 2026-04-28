import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";

@Injectable()
export class PaymentMethodsService {
  constructor(private prisma: PrismaService) {}

  async create(user: AuthUser, data: { name: string; isActive?: boolean }) {
    return this.prisma.paymentMethod.create({
      data: {
        companyId: user.companyId,
        name: data.name,
        isActive: data.isActive ?? true,
      },
    });
  }

  async list(user: AuthUser, query: { isActive?: "true" | "false"; take?: number }) {
    const where: any = { companyId: user.companyId };
    if (query.isActive) {
      where.isActive = query.isActive === "true";
    }
    const data = await this.prisma.paymentMethod.findMany({
      where,
      orderBy: { name: "asc" },
      take: query.take || 50,
    });
    return { data };
  }
}
