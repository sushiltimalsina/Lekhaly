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
exports.PartiesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let PartiesService = class PartiesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(user, input) {
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
    async update(user, id, input) {
        const party = await this.prisma.party.findFirst({
            where: { id, companyId: user.companyId }
        });
        if (!party)
            throw new common_1.NotFoundException("Party not found");
        return this.prisma.party.update({
            where: { id },
            data: input
        });
    }
    async get(user, id) {
        const party = await this.prisma.party.findFirst({
            where: { id, companyId: user.companyId }
        });
        if (!party)
            throw new common_1.NotFoundException("Party not found");
        return party;
    }
    async list(user, filters) {
        const where = { companyId: user.companyId };
        if (filters.type)
            where.type = filters.type;
        if (filters.isActive !== undefined)
            where.isActive = filters.isActive;
        if (filters.q)
            where.name = { contains: filters.q, mode: "insensitive" };
        return this.prisma.party.findMany({
            where,
            orderBy: { name: "asc" },
            skip: filters.skip || 0,
            take: filters.take || 50
        });
    }
    async remove(user, id) {
        const party = await this.prisma.party.findFirst({
            where: { id, companyId: user.companyId }
        });
        if (!party)
            throw new common_1.NotFoundException("Party not found");
        const [lineUsage, voucherUsage] = await Promise.all([
            this.prisma.voucherLine.count({
                where: { companyId: user.companyId, partyId: id }
            }),
            this.prisma.voucher.count({
                where: { companyId: user.companyId, partyId: id }
            })
        ]);
        if (lineUsage + voucherUsage > 0)
            throw new common_1.BadRequestException("Party is referenced by vouchers");
        return this.prisma.party.update({
            where: { id },
            data: { isActive: false }
        });
    }
    async restore(user, id) {
        const party = await this.prisma.party.findFirst({
            where: { id, companyId: user.companyId }
        });
        if (!party)
            throw new common_1.NotFoundException("Party not found");
        return this.prisma.party.update({
            where: { id },
            data: { isActive: true }
        });
    }
};
exports.PartiesService = PartiesService;
exports.PartiesService = PartiesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PartiesService);
//# sourceMappingURL=parties.service.js.map