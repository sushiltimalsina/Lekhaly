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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const argon2_1 = __importDefault(require("argon2"));
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(user, filters) {
        const where = { companyId: user.companyId };
        if (filters.status)
            where.status = filters.status;
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
    async getById(user, userId) {
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
        if (!found)
            throw new common_1.NotFoundException("User not found");
        return found;
    }
    async ensureRoles(companyId, roleIds) {
        if (roleIds.length === 0)
            return [];
        const unique = Array.from(new Set(roleIds));
        const roles = await this.prisma.role.findMany({
            where: { id: { in: unique }, companyId }
        });
        if (roles.length !== unique.length)
            throw new common_1.BadRequestException("Invalid role");
        return unique;
    }
    async create(user, input) {
        const roleIds = input.roleIds ? await this.ensureRoles(user.companyId, input.roleIds) : [];
        const passwordHash = await argon2_1.default.hash(input.password);
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
        }
        catch (err) {
            if (err?.code === "P2002")
                throw new common_1.ConflictException("Email already in use");
            throw err;
        }
    }
    async update(user, userId, input) {
        const found = await this.prisma.user.findFirst({
            where: { id: userId, companyId: user.companyId }
        });
        if (!found)
            throw new common_1.NotFoundException("User not found");
        const data = {};
        if (input.name !== undefined)
            data.name = input.name;
        if (input.status)
            data.status = input.status;
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
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map