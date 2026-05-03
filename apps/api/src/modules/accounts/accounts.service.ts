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
        isGroup: input.isGroup ?? false,
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
      orderBy: { code: "desc" },
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

  /**
   * Fetches the entire COA tree with recursively aggregated balances.
   */
  async getSummary(user: AuthUser) {
    // This uses a PostgreSQL Recursive CTE to calculate the balance of each account
    // including the sum of all its children (if it's a group).
    const results = await this.prisma.$queryRaw<any[]>`
      WITH RECURSIVE coa_hierarchy AS (
        -- Base case: Leaf accounts (those with no children) or all accounts to start
        SELECT 
          id, 
          "parentId", 
          name, 
          code, 
          type, 
          "isGroup", 
          level,
          "isPostable"
        FROM "ChartOfAccount"
        WHERE "companyId" = ${user.companyId} AND "isActive" = true
      ),
      balances AS (
        -- Get raw balances for each account from voucher lines
        SELECT 
          "accountId", 
          SUM(debit - credit) as balance
        FROM "VoucherLine"
        WHERE "companyId" = ${user.companyId}
        GROUP BY "accountId"
      ),
      tree_balances AS (
        -- Map balances to the hierarchy
        SELECT 
          h.id,
          h."parentId",
          h.name,
          h.code,
          h.type,
          h."isGroup",
          h.level,
          COALESCE(b.balance, 0) as direct_balance
        FROM coa_hierarchy h
        LEFT JOIN balances b ON h.id = b."accountId"
      ),
      rolled_up_balances AS (
        -- Initial state for recursion: just the direct balances
        SELECT 
          id as top_id,
          id,
          direct_balance
        FROM tree_balances

        UNION ALL

        -- Recursive step: propagate child balances up to all ancestors
        SELECT 
          t.top_id,
          h."parentId",
          t.direct_balance
        FROM rolled_up_balances t
        JOIN tree_balances h ON t.id = h.id
        WHERE h."parentId" IS NOT NULL
      )
      SELECT 
        t.id,
        t."parentId",
        t.name,
        t.code,
        t.type,
        t."isGroup",
        t.level,
        t.direct_balance,
        SUM(r.direct_balance) as total_balance
      FROM tree_balances t
      JOIN rolled_up_balances r ON t.id = r.id
      GROUP BY 
        t.id, t."parentId", t.name, t.code, t.type, t."isGroup", t.level, t.direct_balance
      ORDER BY t.code DESC;
    `;

    return results;
  }
}
