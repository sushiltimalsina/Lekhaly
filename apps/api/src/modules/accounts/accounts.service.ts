import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { CoaType, Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) { }

  async listTypes() {
    const types = await this.prisma.$queryRaw<{ value: string }[]>`
      SELECT e.enumlabel AS value
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'CoaType' AND pg_type_is_visible(t.oid)
      ORDER BY e.enumsortorder
    `;
    const labels: Record<string, string> = {
      asset: "Assets",
      liability: "Liabilities",
      equity: "Equity",
      income: "Income",
      expense: "Expenses",
    };

    return types.map(({ value }) => ({ value, label: labels[value] ?? value }));
  }

  private async validateParent(
    companyId: string,
    parentId: string | null | undefined,
    type: string,
    id?: string,
    db: PrismaService | Prisma.TransactionClient = this.prisma
  ) {
    if (!parentId) return { parentId: null, level: 0, parentCode: undefined, parentLevel: null };
    if (id && parentId === id) throw new BadRequestException("Account cannot be its own parent");
    const parent = await db.chartOfAccount.findFirst({
      where: { id: parentId, companyId }
    });
    if (!parent) throw new BadRequestException("Invalid parent account");
    if (!parent.isGroup) throw new BadRequestException("Parent account must be a group");
    if (parent.type !== type) throw new BadRequestException("Parent and child accounts must have the same type");

    const visited = new Set<string>();
    let ancestorId = parent.parentId;
    while (ancestorId) {
      if (ancestorId === id) throw new BadRequestException("Account cannot be moved under one of its descendants");
      if (visited.has(ancestorId)) throw new BadRequestException("Invalid account hierarchy");
      visited.add(ancestorId);
      const ancestor = await db.chartOfAccount.findFirst({
        where: { id: ancestorId, companyId },
        select: { parentId: true }
      });
      ancestorId = ancestor?.parentId ?? null;
    }

    return { parentId, level: parent.level + 1, parentCode: parent.code, parentLevel: parent.level };
  }

  private async nextAvailableAccountCode(
    db: Prisma.TransactionClient,
    companyId: string,
    type: CoaType,
    parent: { parentId: string | null; parentCode?: string; parentLevel: number | null }
  ) {
    const rangeStart: Record<CoaType, number> = {
      [CoaType.asset]: 1000,
      [CoaType.equity]: 2000,
      [CoaType.liability]: 3000,
      [CoaType.income]: 4000,
      [CoaType.expense]: 5000,
    };

    const isAvailable = async (code: string) => !(await db.chartOfAccount.findUnique({
      where: { companyId_code: { companyId, code } },
      select: { id: true },
    }));

    if (!parent.parentId) {
      for (let code = rangeStart[type]; code < rangeStart[type] + 1000; code += 1) {
        const candidate = String(code);
        if (await isAvailable(candidate)) return candidate;
      }
    } else if (parent.parentCode && /^\d{4}$/.test(parent.parentCode) && parent.parentLevel !== null && parent.parentLevel <= 2) {
      const step = parent.parentLevel === 0 ? 100 : parent.parentLevel === 1 ? 10 : 1;
      const maxOffset = parent.parentLevel === 0 ? 900 : parent.parentLevel === 1 ? 90 : 9;
      for (let offset = step; offset <= maxOffset; offset += step) {
        const candidate = String(Number(parent.parentCode) + offset);
        if (await isAvailable(candidate)) return candidate;
      }
    } else {
      const prefix = parent.parentCode ?? String(rangeStart[type]);
      for (let suffix = 1; suffix <= 10000; suffix += 1) {
        const candidate = `${prefix}${suffix}`;
        if (candidate.length > 16) break;
        if (await isAvailable(candidate)) return candidate;
      }
    }

    if (parent.parentCode) {
      const prefix = parent.parentCode;
      for (let suffix = 1; suffix <= 10000; suffix += 1) {
        const candidate = `${prefix}${suffix}`;
        if (candidate.length > 16) break;
        if (await isAvailable(candidate)) return candidate;
      }
      throw new BadRequestException(`No account codes remain under parent group ${parent.parentCode}. Enter a code manually.`);
    }

    throw new BadRequestException(`No account codes remain in the ${type} code range. Enter a code manually.`);
  }

  async create(user: AuthUser, input: Prisma.ChartOfAccountCreateInput) {
    const type = input.type as CoaType;
    const isGroup = input.isGroup ?? false;
    const isContra = (input as any).isContra ?? false;
    if (isContra && (isGroup || (type !== CoaType.income && type !== CoaType.expense))) {
      throw new BadRequestException("Contra accounts must be income or expense ledgers");
    }
    const requestedCode = typeof (input as any).code === "string" ? (input as any).code.trim() : "";

    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${user.companyId}), hashtext(${type}))`;
        if (requestedCode) {
          const existing = await tx.chartOfAccount.findUnique({
            where: { companyId_code: { companyId: user.companyId, code: requestedCode } },
            select: { id: true },
          });
          if (existing) throw new BadRequestException(`Account code ${requestedCode} is already in use.`);
        }
        const parent = await this.validateParent(user.companyId, (input as any).parentId, type, undefined, tx);
        const code = requestedCode || await this.nextAvailableAccountCode(tx, user.companyId, type, parent);

        return tx.chartOfAccount.create({
          data: {
            companyId: user.companyId,
            code,
            name: input.name,
            type,
            parentId: parent.parentId,
            level: parent.level,
            isGroup,
            isPostable: !isGroup,
            isContra,
            isActive: input.isActive ?? true
          }
        });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new BadRequestException(
          requestedCode ? `Account code ${requestedCode} is already in use.` : "An account code conflict occurred. Please retry."
        );
      }
      throw error;
    }
  }

  async update(user: AuthUser, id: string, input: Prisma.ChartOfAccountUpdateInput) {
    const account = await this.prisma.chartOfAccount.findFirst({ where: { id, companyId: user.companyId } });
    if (!account) throw new NotFoundException("Account not found");
    const parentId = Object.prototype.hasOwnProperty.call(input, "parentId") ? (input as any).parentId : account.parentId;
    const type = (input as any).type ?? account.type;
    const parent = await this.validateParent(user.companyId, parentId, type, id);
    const isGroup = (input as any).isGroup ?? account.isGroup;
    const isContra = (input as any).isContra ?? account.isContra;
    if (isContra && (isGroup || (type !== CoaType.income && type !== CoaType.expense))) {
      throw new BadRequestException("Contra accounts must be income or expense ledgers");
    }
    if (account.isGroup && type !== account.type) {
      const childCount = await this.prisma.chartOfAccount.count({ where: { companyId: user.companyId, parentId: id } });
      if (childCount > 0) throw new BadRequestException("A group with child accounts cannot change financial type");
    }
    if (type !== account.type || isContra !== account.isContra) {
      const references = await this.getReferenceCounts(user.companyId, id);
      const referenceCount = Object.values(references ?? {}).reduce((total, count) => total + count, 0);
      if (referenceCount > 0) {
        throw new BadRequestException("Financial type or contra status cannot change while the account is referenced");
      }
    }
    if (!isGroup && account.isGroup) {
      const childCount = await this.prisma.chartOfAccount.count({ where: { companyId: user.companyId, parentId: id } });
      if (childCount > 0) throw new BadRequestException("A group with child accounts cannot be changed to a ledger account");
    }

    return this.prisma.chartOfAccount.update({
      where: { id },
      data: {
        code: (input as any).code,
        name: (input as any).name,
        type,
        parentId: parent.parentId,
        level: parent.level,
        isGroup,
        isPostable: !isGroup,
        isContra,
        isActive: (input as any).isActive
      }
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
    const account = await this.prisma.chartOfAccount.findFirst({
      where: { id, companyId: user.companyId },
      include: {
        _count: {
          select: {
            children: true,
            voucherLines: true,
            incomeItems: true,
            expenseItems: true,
            inputTaxCodes: true,
            outputTaxCodes: true,
            bankAccounts: true,
            invoices: true,
            billSundries: true,
            invoiceSundries: true,
            quotationSundries: true,
            salesOrderSundries: true,
            purchaseOrderSundries: true,
          },
        },
      },
    });
    if (!account) throw new NotFoundException("Account not found");
    if (account._count.children > 0) throw new BadRequestException("Remove or move child accounts before removing this group");

    const { children: _children, ...references } = account._count;
    const referenceCount = Object.values(references).reduce((total, count) => total + count, 0);
    if (referenceCount > 0) {
      return this.prisma.chartOfAccount.update({ where: { id }, data: { isActive: false } });
    }

    return this.prisma.chartOfAccount.delete({ where: { id } });
  }

  private async getReferenceCounts(companyId: string, id: string) {
    const account = await this.prisma.chartOfAccount.findFirst({
      where: { id, companyId },
      select: {
        _count: {
          select: {
            voucherLines: true,
            incomeItems: true,
            expenseItems: true,
            inputTaxCodes: true,
            outputTaxCodes: true,
            bankAccounts: true,
            invoices: true,
            billSundries: true,
            invoiceSundries: true,
            quotationSundries: true,
            salesOrderSundries: true,
            purchaseOrderSundries: true,
          },
        },
      },
    });
    return account?._count;
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
          "isPostable",
          "isContra"
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
          h."isContra",
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
        t."isContra",
        t.direct_balance,
        SUM(r.direct_balance) as total_balance
      FROM tree_balances t
      JOIN rolled_up_balances r ON t.id = r.id
      GROUP BY
        t.id, t."parentId", t.name, t.code, t.type, t."isGroup", t.level, t."isContra", t.direct_balance
      ORDER BY t.code DESC;
    `;

    return results;
  }
}
