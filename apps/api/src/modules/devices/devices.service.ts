import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";

@Injectable()
export class DevicesService {
  constructor(private prisma: PrismaService) {}

  async list(
    user: AuthUser,
    filters: { trusted?: boolean; q?: string; skip?: number; take?: number }
  ) {
    const where: Prisma.DeviceWhereInput = { companyId: user.companyId };
    if (filters.trusted !== undefined) where.trusted = filters.trusted;
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

  async setTrust(user: AuthUser, deviceId: string, trusted: boolean) {
    const device = await this.prisma.device.findFirst({
      where: { id: deviceId, companyId: user.companyId }
    });
    if (!device) throw new NotFoundException("Device not found");

    return this.prisma.device.update({
      where: { id: device.id },
      data: { trusted }
    });
  }

  async unlinkUser(user: AuthUser, deviceId: string, targetUserId: string) {
    const device = await this.prisma.device.findFirst({
      where: { id: deviceId, companyId: user.companyId }
    });
    if (!device) throw new NotFoundException("Device not found");

    const link = await this.prisma.deviceUserLink.findUnique({
      where: { deviceId_userId: { deviceId, userId: targetUserId } }
    });
    if (!link) throw new NotFoundException("Device link not found");

    await this.prisma.deviceUserLink.delete({
      where: { deviceId_userId: { deviceId, userId: targetUserId } }
    });

    return { deviceId, userId: targetUserId, unlinked: true };
  }
}
