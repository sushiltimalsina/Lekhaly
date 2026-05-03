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
exports.AccountsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let AccountsService = class AccountsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async validateParent(companyId, parentId, id) {
        if (!parentId)
            return;
        if (id && parentId === id)
            throw new common_1.BadRequestException("Account cannot be its own parent");
        const parent = await this.prisma.chartOfAccount.findFirst({
            where: { id: parentId, companyId }
        });
        if (!parent)
            throw new common_1.BadRequestException("Invalid parent account");
    }
    async create(user, input) {
        await this.validateParent(user.companyId, input.parentId);
        return this.prisma.chartOfAccount.create({
            data: {
                companyId: user.companyId,
                code: input.code,
                name: input.name,
                type: input.type,
                parentId: input.parentId || null,
                isGroup: input.isGroup ?? false,
                isPostable: input.isPostable ?? true,
                isActive: input.isActive ?? true
            }
        });
    }
    async update(user, id, input) {
        const account = await this.prisma.chartOfAccount.findFirst({ where: { id, companyId: user.companyId } });
        if (!account)
            throw new common_1.NotFoundException("Account not found");
        await this.validateParent(user.companyId, input.parentId, id);
        return this.prisma.chartOfAccount.update({
            where: { id },
            data: input
        });
    }
    async get(user, id) {
        const account = await this.prisma.chartOfAccount.findFirst({ where: { id, companyId: user.companyId } });
        if (!account)
            throw new common_1.NotFoundException("Account not found");
        return account;
    }
    async list(user, filters) {
        const where = { companyId: user.companyId };
        if (filters.type) {
            where.type = filters.type;
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
    async remove(user, id) {
        const account = await this.prisma.chartOfAccount.findFirst({ where: { id, companyId: user.companyId } });
        if (!account)
            throw new common_1.NotFoundException("Account not found");
        const [children, usage, itemIncome, itemExpense, taxInput, taxOutput] = await Promise.all([
            this.prisma.chartOfAccount.count({ where: { companyId: user.companyId, parentId: id } }),
            this.prisma.voucherLine.count({ where: { companyId: user.companyId, accountId: id } }),
            this.prisma.item.count({ where: { companyId: user.companyId, incomeAccountId: id } }),
            this.prisma.item.count({ where: { companyId: user.companyId, expenseAccountId: id } }),
            this.prisma.taxCode.count({ where: { companyId: user.companyId, inputTaxAccountId: id } }),
            this.prisma.taxCode.count({ where: { companyId: user.companyId, outputTaxAccountId: id } })
        ]);
        if (children > 0)
            throw new common_1.BadRequestException("Account has child accounts");
        if (usage > 0)
            throw new common_1.BadRequestException("Account is referenced by vouchers");
        if (itemIncome + itemExpense + taxInput + taxOutput > 0) {
            throw new common_1.BadRequestException("Account is referenced by items or tax codes");
        }
        return this.prisma.chartOfAccount.update({
            where: { id },
            data: { isActive: false }
        });
    }
    async restore(user, id) {
        const account = await this.prisma.chartOfAccount.findFirst({ where: { id, companyId: user.companyId } });
        if (!account)
            throw new common_1.NotFoundException("Account not found");
        return this.prisma.chartOfAccount.update({
            where: { id },
            data: { isActive: true }
        });
    }
    async getSummary(user) {
        const results = await this.prisma.$queryRaw `
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
};
exports.AccountsService = AccountsService;
exports.AccountsService = AccountsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AccountsService);
//# sourceMappingURL=accounts.service.js.map