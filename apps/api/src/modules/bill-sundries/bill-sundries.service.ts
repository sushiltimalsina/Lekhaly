import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";

@Injectable()
export class BillSundriesService {
    constructor(private prisma: PrismaService) { }

    async list(user: AuthUser, filters: { isActive?: boolean; q?: string; take?: number; skip?: number }) {
        const where: Prisma.BillSundryWhereInput = { companyId: user.companyId };
        if (filters.isActive !== undefined) where.isActive = filters.isActive;
        if (filters.q) where.name = { contains: filters.q, mode: "insensitive" };

        return this.prisma.billSundry.findMany({
            where,
            include: { account: true },
            orderBy: { name: "desc" },
            take: filters.take || 50,
            skip: filters.skip || 0
        });
    }

    async get(user: AuthUser, id: string) {
        const sundry = await this.prisma.billSundry.findFirst({
            where: { id, companyId: user.companyId },
            include: { account: true }
        });
        if (!sundry) throw new NotFoundException("Bill sundry not found");
        return sundry;
    }

    async create(user: AuthUser, input: any) {
        return this.prisma.billSundry.create({
            data: {
                companyId: user.companyId,
                name: input.name,
                type: input.type || "add",
                rate: input.rate ? new Prisma.Decimal(input.rate) : null,
                accountId: input.accountId
            }
        });
    }

    async update(user: AuthUser, id: string, input: any) {
        const sundry = await this.prisma.billSundry.findFirst({ where: { id, companyId: user.companyId } });
        if (!sundry) throw new NotFoundException("Bill sundry not found");

        return this.prisma.billSundry.update({
            where: { id: sundry.id },
            data: {
                name: input.name ?? sundry.name,
                type: input.type ?? sundry.type,
                rate: input.rate !== undefined ? (input.rate ? new Prisma.Decimal(input.rate) : null) : sundry.rate,
                accountId: input.accountId !== undefined ? input.accountId : sundry.accountId,
                isActive: input.isActive ?? sundry.isActive
            }
        });
    }

    async remove(user: AuthUser, id: string) {
        const sundry = await this.prisma.billSundry.findFirst({ where: { id, companyId: user.companyId } });
        if (!sundry) throw new NotFoundException("Bill sundry not found");

        return this.prisma.billSundry.update({
            where: { id: sundry.id },
            data: { isActive: false }
        });
    }
}
