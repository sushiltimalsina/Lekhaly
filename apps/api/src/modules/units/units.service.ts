import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  async create(user: AuthUser, input: { name: string }) {
    const existing = await this.prisma.unit.findFirst({
      where: {
        companyId: user.companyId,
        name: { equals: input.name, mode: "insensitive" }
      }
    });
    if (existing) throw new BadRequestException("Unit already exists");

    return this.prisma.unit.create({
      data: {
        companyId: user.companyId,
        name: input.name.trim()
      }
    });
  }

  async update(user: AuthUser, id: string, input: { name: string }) {
    const existing = await this.prisma.unit.findFirst({
      where: {
        companyId: user.companyId,
        name: { equals: input.name, mode: "insensitive" },
        NOT: { id }
      }
    });
    if (existing) throw new BadRequestException("Unit with this name already exists");

    return this.prisma.unit.update({
      where: { id },
      data: { name: input.name.trim() }
    });
  }

  async list(user: AuthUser, filters: { q?: string; skip?: number; take?: number }) {
    const where: Prisma.UnitWhereInput = { companyId: user.companyId };
    if (filters.q) where.name = { contains: filters.q, mode: "insensitive" };

    return this.prisma.unit.findMany({
      where,
      orderBy: { name: "asc" },
      skip: filters.skip || 0,
      take: filters.take || 100
    });
  }

  async remove(user: AuthUser, id: string) {
    const unit = await this.prisma.unit.findFirst({
      where: { id, companyId: user.companyId }
    });
    if (!unit) throw new BadRequestException("Unit not found");

    const usage = await this.prisma.item.count({ where: { companyId: user.companyId, unit: unit.name } });
    if (usage > 0) throw new BadRequestException("Unit is used by items");

    return this.prisma.unit.delete({ where: { id } });
  }
}
