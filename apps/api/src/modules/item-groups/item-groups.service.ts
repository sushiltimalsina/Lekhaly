import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";

@Injectable()
export class ItemGroupsService {
  constructor(private prisma: PrismaService) {}

  async create(user: AuthUser, input: { name: string }) {
    const existing = await this.prisma.itemGroup.findFirst({
      where: { companyId: user.companyId, name: { equals: input.name, mode: "insensitive" } }
    });
    if (existing) throw new BadRequestException("Group already exists");

    return this.prisma.itemGroup.create({
      data: { companyId: user.companyId, name: input.name.trim() }
    });
  }

  async update(user: AuthUser, id: string, input: { name: string }) {
    const existing = await this.prisma.itemGroup.findFirst({
      where: {
        companyId: user.companyId,
        name: { equals: input.name, mode: "insensitive" },
        NOT: { id }
      }
    });
    if (existing) throw new BadRequestException("Group with this name already exists");

    return this.prisma.itemGroup.update({
      where: { id },
      data: { name: input.name.trim() }
    });
  }

  async list(user: AuthUser, filters: { q?: string; skip?: number; take?: number }) {
    const where: Prisma.ItemGroupWhereInput = { companyId: user.companyId };
    if (filters.q) where.name = { contains: filters.q, mode: "insensitive" };
    return this.prisma.itemGroup.findMany({
      where,
      orderBy: { name: "asc" },
      skip: filters.skip || 0,
      take: filters.take || 200
    });
  }

  async remove(user: AuthUser, id: string) {
    const group = await this.prisma.itemGroup.findFirst({
      where: { id, companyId: user.companyId }
    });
    if (!group) throw new NotFoundException("Group not found");

    const usage = await this.prisma.item.count({ where: { companyId: user.companyId, groupId: id } });
    if (usage > 0) throw new BadRequestException("Group is used by items");

    return this.prisma.itemGroup.delete({ where: { id } });
  }
}

