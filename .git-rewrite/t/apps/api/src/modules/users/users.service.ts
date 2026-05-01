import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";
import argon2 from "argon2";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async list(user: AuthUser, filters: { q?: string; status?: "active" | "disabled"; skip?: number; take?: number }) {
    const where: Prisma.UserWhereInput = { companyId: user.companyId };
    if (filters.status) where.status = filters.status;
    if (filters.q) {
      where.OR = [
        { email: { contains: filters.q, mode: "insensitive" } },
        { name: { contains: filters.q, mode: "insensitive" } }
      ];
    }

    return this.prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: filters.skip || 0,
      take: filters.take || 50,
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        createdAt: true,
        userRoles: { include: { role: true } }
      }
    });
  }

  async getById(user: AuthUser, userId: string) {
    const found = await this.prisma.user.findFirst({
      where: { id: userId, companyId: user.companyId },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        createdAt: true,
        userRoles: { include: { role: true } }
      }
    });
    if (!found) throw new NotFoundException("User not found");
    return found;
  }

  private async ensureRoles(companyId: string, roleIds: string[]) {
    if (roleIds.length === 0) return [];
    const unique = Array.from(new Set(roleIds));
    const roles = await this.prisma.role.findMany({
      where: { id: { in: unique }, companyId }
    });
    if (roles.length !== unique.length) throw new BadRequestException("Invalid role");
    return unique;
  }

  async create(
    user: AuthUser,
    input: { email: string; name?: string; password: string; roleIds?: string[] }
  ) {
    const roleIds = input.roleIds ? await this.ensureRoles(user.companyId, input.roleIds) : [];
    const passwordHash = await argon2.hash(input.password);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            companyId: user.companyId,
            email: input.email,
            name: input.name,
            passwordHash
          }
        });

        if (roleIds.length) {
          await tx.userRole.createMany({
            data: roleIds.map((roleId) => ({ userId: created.id, roleId }))
          });
        }

        return { id: created.id };
      });
    } catch (err: any) {
      if (err?.code === "P2002") throw new ConflictException("Email already in use");
      throw err;
    }
  }

  async update(
    user: AuthUser,
    userId: string,
    input: { name?: string; status?: "active" | "disabled"; roleIds?: string[] }
  ) {
    const found = await this.prisma.user.findFirst({
      where: { id: userId, companyId: user.companyId }
    });
    if (!found) throw new NotFoundException("User not found");

    const data: Prisma.UserUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.status) data.status = input.status;

    if (input.roleIds) {
      const roleIds = await this.ensureRoles(user.companyId, input.roleIds);
      return this.prisma.$transaction(async (tx) => {
        await tx.userRole.deleteMany({ where: { userId: found.id } });
        if (roleIds.length) {
          await tx.userRole.createMany({
            data: roleIds.map((roleId) => ({ userId: found.id, roleId }))
          });
        }

        return tx.user.update({
          where: { id: found.id },
          data
        });
      });
    }

    return this.prisma.user.update({ where: { id: found.id }, data });
  }
}
