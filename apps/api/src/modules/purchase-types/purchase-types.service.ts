import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";

@Injectable()
export class PurchaseTypesService {
  constructor(private prisma: PrismaService) {}

  async create(user: AuthUser, data: { name: string; isActive?: boolean }) {
    return this.prisma.purchaseType.create({
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
    const data = await this.prisma.purchaseType.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { name: "desc" }],
      take: query.take || 50,
    });
    return { data };
  }

  async updateSortOrder(user: AuthUser, data: { id: string; sortOrder: number }[]) {
    const queries = data.map((item) =>
      this.prisma.purchaseType.update({
        where: { id: item.id, companyId: user.companyId },
        data: { sortOrder: item.sortOrder },
      }),
    );
    await this.prisma.$transaction(queries);
    return { success: true };
  }
}
