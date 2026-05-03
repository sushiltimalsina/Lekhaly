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
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let RolesService = class RolesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(user, filters) {
        const where = { companyId: user.companyId };
        if (filters.q) {
            where.name = { contains: filters.q, mode: "insensitive" };
        }
        return this.prisma.role.findMany({
            where,
            orderBy: { name: "desc" },
            skip: filters.skip || 0,
            take: filters.take || 50,
            include: {
                rolePermissions: { include: { permission: true } },
                userRoles: { include: { user: { select: { id: true, email: true, name: true, status: true } } } }
            }
        });
    }
    async listPermissions() {
        return this.prisma.permission.findMany({ orderBy: { code: "desc" } });
    }
    async ensurePermissionsExist(permissionCodes) {
        if (permissionCodes.length === 0) {
            throw new common_1.BadRequestException("Permissions required");
        }
        const uniqueCodes = Array.from(new Set(permissionCodes));
        const permissions = await this.prisma.permission.findMany({
            where: { code: { in: uniqueCodes } }
        });
        if (permissions.length !== uniqueCodes.length) {
            throw new common_1.BadRequestException("Invalid permission");
        }
        return uniqueCodes;
    }
    async create(user, input) {
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
        }
        catch (err) {
            if (err?.code === "P2002")
                throw new common_1.ConflictException("Role already exists");
            throw err;
        }
    }
    async getById(user, roleId) {
        const role = await this.prisma.role.findFirst({
            where: { id: roleId, companyId: user.companyId },
            include: {
                rolePermissions: { include: { permission: true } },
                userRoles: { include: { user: { select: { id: true, email: true, name: true, status: true } } } }
            }
        });
        if (!role)
            throw new common_1.NotFoundException("Role not found");
        return role;
    }
    async update(user, roleId, input) {
        const role = await this.prisma.role.findFirst({
            where: { id: roleId, companyId: user.companyId }
        });
        if (!role)
            throw new common_1.NotFoundException("Role not found");
        const data = {};
        if (input.name)
            data.name = input.name;
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
        }
        catch (err) {
            if (err?.code === "P2002")
                throw new common_1.ConflictException("Role already exists");
            throw err;
        }
    }
    async remove(user, roleId) {
        const role = await this.prisma.role.findFirst({
            where: { id: roleId, companyId: user.companyId },
            include: { userRoles: true }
        });
        if (!role)
            throw new common_1.NotFoundException("Role not found");
        if (role.userRoles.length > 0) {
            throw new common_1.BadRequestException("Role is assigned to users");
        }
        await this.prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
        await this.prisma.role.delete({ where: { id: role.id } });
        return { id: role.id, deleted: true };
    }
    async assignUser(user, roleId, targetUserId) {
        const role = await this.prisma.role.findFirst({
            where: { id: roleId, companyId: user.companyId }
        });
        if (!role)
            throw new common_1.NotFoundException("Role not found");
        const target = await this.prisma.user.findFirst({
            where: { id: targetUserId, companyId: user.companyId }
        });
        if (!target)
            throw new common_1.NotFoundException("User not found");
        try {
            await this.prisma.userRole.create({
                data: { userId: target.id, roleId: role.id }
            });
        }
        catch (err) {
            if (err?.code === "P2002")
                throw new common_1.ConflictException("User already assigned");
            throw err;
        }
        return { roleId: role.id, userId: target.id, assigned: true };
    }
    async removeUser(user, roleId, targetUserId) {
        const role = await this.prisma.role.findFirst({
            where: { id: roleId, companyId: user.companyId }
        });
        if (!role)
            throw new common_1.NotFoundException("Role not found");
        const link = await this.prisma.userRole.findUnique({
            where: { userId_roleId: { userId: targetUserId, roleId: role.id } }
        });
        if (!link)
            throw new common_1.NotFoundException("Role link not found");
        await this.prisma.userRole.delete({
            where: { userId_roleId: { userId: targetUserId, roleId: role.id } }
        });
        return { roleId: role.id, userId: targetUserId, removed: true };
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RolesService);
//# sourceMappingURL=roles.service.js.map