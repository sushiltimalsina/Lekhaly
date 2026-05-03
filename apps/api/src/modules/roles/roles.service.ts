import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async list(user: AuthUser, filters: { q?: string; skip?: number; take?: number }) {
    const where: Prisma.RoleWhereInput = { companyId: user.companyId };
    if (filters.q) {
      where.name = { contains: filters.q, mode: "insensitive" };
    }

    return this.prisma.role.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { name: "desc" }],
      skip: filters.skip || 0,
      take: filters.take || 50,
      include: {
        rolePermissions: { include: { permission: true } },
        userRoles: { include: { user: { select: { id: true, email: true, name: true, status: true } } } }
      }
    });
  }

  async updateSortOrder(user: AuthUser, data: { id: string; sortOrder: number }[]) {
    const queries = data.map((item) =>
      this.prisma.role.update({
        where: { id: item.id, companyId: user.companyId },
        data: { sortOrder: item.sortOrder },
      }),
    );
    await this.prisma.$transaction(queries);
    return { success: true };
  }

  async listPermissions() {
    return this.prisma.permission.findMany({ orderBy: { code: "desc" } });
  }

  private async ensurePermissionsExist(permissionCodes: string[]) {
    if (permissionCodes.length === 0) {
      throw new BadRequestException("Permissions required");
    }
    const uniqueCodes = Array.from(new Set(permissionCodes));
    const permissions = await this.prisma.permission.findMany({
      where: { code: { in: uniqueCodes } }
    });
    if (permissions.length !== uniqueCodes.length) {
      throw new BadRequestException("Invalid permission");
    }
    return uniqueCodes;
  }

  async create(user: AuthUser, input: { name: string; permissionCodes: string[] }) {
    const uniqueCodes = await this.ensurePermissionsExist(input.permissionCodes);
    try {
      return await this.prisma.role.create({
        data: {
          companyId: user.companyId,
          name: input.name,
          rolePermissions: {
            create: uniqueCodes.map((code) => ({ permissionCode: code }))
          }
        },
        include: { rolePermissions: { include: { permission: true } } }
      });
    } catch (err: any) {
      if (err?.code === "P2002") throw new ConflictException("Role already exists");
      throw err;
    }
  }

  async getById(user: AuthUser, roleId: string) {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, companyId: user.companyId },
      include: {
        rolePermissions: { include: { permission: true } },
        userRoles: { include: { user: { select: { id: true, email: true, name: true, status: true } } } }
      }
    });
    if (!role) throw new NotFoundException("Role not found");
    return role;
  }

  async update(
    user: AuthUser,
    roleId: string,
    input: { name?: string; permissionCodes?: string[] }
  ) {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, companyId: user.companyId }
    });
    if (!role) throw new NotFoundException("Role not found");

    const data: Prisma.RoleUpdateInput = {};
    if (input.name) data.name = input.name;

    if (input.permissionCodes) {
      const uniqueCodes = await this.ensurePermissionsExist(input.permissionCodes);
      return this.prisma.$transaction(async (tx) => {
        await tx.rolePermission.deleteMany({ where: { roleId: role.id } });
        await tx.rolePermission.createMany({
          data: uniqueCodes.map((code) => ({ roleId: role.id, permissionCode: code }))
        });

        return tx.role.update({
          where: { id: role.id },
          data,
          include: { rolePermissions: { include: { permission: true } } }
        });
      });
    }

    try {
      return await this.prisma.role.update({
        where: { id: role.id },
        data,
        include: { rolePermissions: { include: { permission: true } } }
      });
    } catch (err: any) {
      if (err?.code === "P2002") throw new ConflictException("Role already exists");
      throw err;
    }
  }

  async remove(user: AuthUser, roleId: string) {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, companyId: user.companyId },
      include: { userRoles: true }
    });
    if (!role) throw new NotFoundException("Role not found");
    if (role.userRoles.length > 0) {
      throw new BadRequestException("Role is assigned to users");
    }

    await this.prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await this.prisma.role.delete({ where: { id: role.id } });
    return { id: role.id, deleted: true };
  }

  async assignUser(user: AuthUser, roleId: string, targetUserId: string) {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, companyId: user.companyId }
    });
    if (!role) throw new NotFoundException("Role not found");

    const target = await this.prisma.user.findFirst({
      where: { id: targetUserId, companyId: user.companyId }
    });
    if (!target) throw new NotFoundException("User not found");

    try {
      await this.prisma.userRole.create({
        data: { userId: target.id, roleId: role.id }
      });
    } catch (err: any) {
      if (err?.code === "P2002") throw new ConflictException("User already assigned");
      throw err;
    }

    return { roleId: role.id, userId: target.id, assigned: true };
  }

  async removeUser(user: AuthUser, roleId: string, targetUserId: string) {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, companyId: user.companyId }
    });
    if (!role) throw new NotFoundException("Role not found");

    const link = await this.prisma.userRole.findUnique({
      where: { userId_roleId: { userId: targetUserId, roleId: role.id } }
    });
    if (!link) throw new NotFoundException("Role link not found");

    await this.prisma.userRole.delete({
      where: { userId_roleId: { userId: targetUserId, roleId: role.id } }
    });
    return { roleId: role.id, userId: targetUserId, removed: true };
  }
}
