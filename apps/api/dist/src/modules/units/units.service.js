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
exports.UnitsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let UnitsService = class UnitsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(user, input) {
        const existing = await this.prisma.unit.findFirst({
            where: {
                companyId: user.companyId,
                name: { equals: input.name, mode: "insensitive" }
            }
        });
        if (existing)
            throw new common_1.BadRequestException("Unit already exists");
        return this.prisma.unit.create({
            data: {
                companyId: user.companyId,
                name: input.name.trim()
            }
        });
    }
    async update(user, id, input) {
        const existing = await this.prisma.unit.findFirst({
            where: {
                companyId: user.companyId,
                name: { equals: input.name, mode: "insensitive" },
                NOT: { id }
            }
        });
        if (existing)
            throw new common_1.BadRequestException("Unit with this name already exists");
        return this.prisma.unit.update({
            where: { id },
            data: { name: input.name.trim() }
        });
    }
    async list(user, filters) {
        const where = { companyId: user.companyId };
        if (filters.q)
            where.name = { contains: filters.q, mode: "insensitive" };
        return this.prisma.unit.findMany({
            where,
            orderBy: { name: "desc" },
            skip: filters.skip || 0,
            take: filters.take || 100
        });
    }
    async remove(user, id) {
        const unit = await this.prisma.unit.findFirst({
            where: { id, companyId: user.companyId }
        });
        if (!unit)
            throw new common_1.BadRequestException("Unit not found");
        const usage = await this.prisma.item.count({ where: { companyId: user.companyId, unit: unit.name } });
        if (usage > 0)
            throw new common_1.BadRequestException("Unit is used by items");
        return this.prisma.unit.delete({ where: { id } });
    }
};
exports.UnitsService = UnitsService;
exports.UnitsService = UnitsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UnitsService);
//# sourceMappingURL=units.service.js.map