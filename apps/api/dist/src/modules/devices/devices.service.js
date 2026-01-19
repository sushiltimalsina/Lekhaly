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
exports.DevicesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let DevicesService = class DevicesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(user, filters) {
        const where = { companyId: user.companyId };
        if (filters.trusted !== undefined)
            where.trusted = filters.trusted;
        if (filters.q) {
            where.OR = [
                { label: { contains: filters.q, mode: "insensitive" } },
                { platform: { contains: filters.q, mode: "insensitive" } }
            ];
        }
        return this.prisma.device.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: filters.skip || 0,
            take: filters.take || 50,
            include: {
                deviceUsers: {
                    include: {
                        user: { select: { id: true, email: true, name: true, status: true } }
                    }
                }
            }
        });
    }
    async setTrust(user, deviceId, trusted) {
        const device = await this.prisma.device.findFirst({
            where: { id: deviceId, companyId: user.companyId }
        });
        if (!device)
            throw new common_1.NotFoundException("Device not found");
        return this.prisma.device.update({
            where: { id: device.id },
            data: { trusted }
        });
    }
    async unlinkUser(user, deviceId, targetUserId) {
        const device = await this.prisma.device.findFirst({
            where: { id: deviceId, companyId: user.companyId }
        });
        if (!device)
            throw new common_1.NotFoundException("Device not found");
        const link = await this.prisma.deviceUserLink.findUnique({
            where: { deviceId_userId: { deviceId, userId: targetUserId } }
        });
        if (!link)
            throw new common_1.NotFoundException("Device link not found");
        await this.prisma.deviceUserLink.delete({
            where: { deviceId_userId: { deviceId, userId: targetUserId } }
        });
        return { deviceId, userId: targetUserId, unlinked: true };
    }
};
exports.DevicesService = DevicesService;
exports.DevicesService = DevicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DevicesService);
//# sourceMappingURL=devices.service.js.map