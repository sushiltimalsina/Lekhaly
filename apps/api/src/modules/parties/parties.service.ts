import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";

@Injectable()
export class PartiesService {
  constructor(private prisma: PrismaService) {}

  async create(user: AuthUser, input: Prisma.PartyCreateInput) {
    return this.prisma.party.create({
      data: {
        companyId: user.companyId,
        type: input.type,
        name: input.name,
        email: input.email,
        phone: input.phone,
        address: input.address,
        panNumber: input.panNumber,
        vatNumber: input.vatNumber
      }
    });
  }

  async update(user: AuthUser, id: string, input: Prisma.PartyUpdateInput) {
    const party = await this.prisma.party.findFirst({
      where: { id, companyId: user.companyId }
    });
    if (!party) throw new NotFoundException("Party not found");

    return this.prisma.party.update({
      where: { id },
      data: input
    });
  }

  async get(user: AuthUser, id: string) {
    const party = await this.prisma.party.findFirst({
      where: { id, companyId: user.companyId }
    });
    if (!party) throw new NotFoundException("Party not found");
    return party;
  }

  async list(
    user: AuthUser,
    filters: { type?: string; isActive?: boolean; q?: string; skip?: number; take?: number }
  ) {
    const where: Prisma.PartyWhereInput = { companyId: user.companyId };
    if (filters.type) where.type = filters.type as any;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.q) where.name = { contains: filters.q, mode: "insensitive" };

    return this.prisma.party.findMany({
      where,
      orderBy: { name: "asc" },
      skip: filters.skip || 0,
      take: filters.take || 50
    });
  }
}
