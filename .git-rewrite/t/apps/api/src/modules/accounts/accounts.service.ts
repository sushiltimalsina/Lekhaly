import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) { }

  private async validateParent(companyId: string, parentId?: string | null, id?: string) {
    if (!parentId) return;
    if (id && parentId === id) throw new BadRequestException("Account cannot be its own parent");
    const parent = await this.prisma.chartOfAccount.findFirst({
      where: { id: parentId, companyId }
    });
    if (!parent) throw new BadRequestException("Invalid parent account");
  }

  async create(user: AuthUser, input: Prisma.ChartOfAccountCreateInput) {
    await this.validateParent(user.companyId, (input as any).parentId);
    return this.prisma.chartOfAccount.create({
      data: {
        companyId: user.companyId,
        code: input.code,
        name: input.name,
        type: input.type,
        parentId: (input as any).parentId || null,
        isPostable: input.isPostable ?? true,
        isActive: input.isActive ?? true
      }
    });
  }

  async update(user: AuthUser, id: string, input: Prisma.ChartOfAccountUpdateInput) {
    const account = await this.prisma.chartOfAccount.findFirst({ where: { id, companyId: user.companyId } });
    if (!account) throw new NotFoundException("Account not found");
    await this.validateParent(user.companyId, (input as any).parentId, id);

    return this.prisma.chartOfAccount.update({
      where: { id },
      data: input
    });
  }

  async get(user: AuthUser, id: string) {
    const account = await this.prisma.chartOfAccount.findFirst({ where: { id, companyId: user.companyId } });
    if (!account) throw new NotFoundException("Account not found");
    return account;
  }

  async list(user: AuthUser, filters: { type?: string; isActive?: boolean; q?: string; skip?: number; take?: number }) {
    const where: Prisma.ChartOfAccountWhereInput = { companyId: user.companyId };
    if (filters.type) {
      where.type = filters.type as any;
    }
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    if (filters.q) {
      where.name = { contains: filters.q, mode: "insensitive" };
    }

    return this.prisma.chartOfAccount.findMany({
      where,
      orderBy: { code: "asc" },
      skip: filters.skip ?? 0,
      take: filters.take ?? 1000
    });
  }

  async remove(user: AuthUser, id: string) {
    const account = await this.prisma.chartOfAccount.findFirst({ where: { id, companyId: user.companyId } });
    if (!account) throw new NotFoundException("Account not found");

    const [children, usage, itemIncome, itemExpense, taxInput, taxOutput] = await Promise.all([
      this.prisma.chartOfAccount.count({ where: { companyId: user.companyId, parentId: id } }),
      this.prisma.voucherLine.count({ where: { companyId: user.companyId, accountId: id } }),
      this.prisma.item.count({ where: { companyId: user.companyId, incomeAccountId: id } }),
      this.prisma.item.count({ where: { companyId: user.companyId, expenseAccountId: id } }),
      this.prisma.taxCode.count({ where: { companyId: user.companyId, inputTaxAccountId: id } }),
      this.prisma.taxCode.count({ where: { companyId: user.companyId, outputTaxAccountId: id } })
    ]);

    if (children > 0) throw new BadRequestException("Account has child accounts");
    if (usage > 0) throw new BadRequestException("Account is referenced by vouchers");
    if (itemIncome + itemExpense + taxInput + taxOutput > 0) {
      throw new BadRequestException("Account is referenced by items or tax codes");
    }

    return this.prisma.chartOfAccount.update({
      where: { id },
      data: { isActive: false }
    });
  }

  async restore(user: AuthUser, id: string) {
    const account = await this.prisma.chartOfAccount.findFirst({ where: { id, companyId: user.companyId } });
    if (!account) throw new NotFoundException("Account not found");

    return this.prisma.chartOfAccount.update({
      where: { id },
      data: { isActive: true }
    });
  }
}
