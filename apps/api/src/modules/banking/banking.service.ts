import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";

@Injectable()
export class BankingService {
  constructor(private prisma: PrismaService) {}

  private async ensureBankAccount(user: AuthUser, accountId: string) {
    const account = await this.prisma.chartOfAccount.findFirst({
      where: { id: accountId, companyId: user.companyId }
    });
    if (!account) throw new BadRequestException("Account not found");
    if (account.type !== "asset") {
      throw new BadRequestException("Bank account must be an asset account");
    }
    return account;
  }

  async createBankAccount(
    user: AuthUser,
    input: { accountId: string; bankName?: string; accountNumber?: string }
  ) {
    await this.ensureBankAccount(user, input.accountId);
    return this.prisma.bankAccount.create({
      data: {
        companyId: user.companyId,
        accountId: input.accountId,
        bankName: input.bankName,
        accountNumber: input.accountNumber
      }
    });
  }

  async listStatements(
    user: AuthUser,
    filters: { bankAccountId?: string; from?: Date; to?: Date; skip?: number; take?: number }
  ) {
    const where: Prisma.BankStatementWhereInput = { companyId: user.companyId };
    if (filters.bankAccountId) where.bankAccountId = filters.bankAccountId;
    if (filters.from || filters.to) {
      where.periodFrom = {};
      if (filters.from) (where.periodFrom as Prisma.DateTimeFilter).gte = filters.from;
      if (filters.to) (where.periodFrom as Prisma.DateTimeFilter).lte = filters.to;
    }

    return this.prisma.bankStatement.findMany({
      where,
      orderBy: { periodFrom: "desc" },
      skip: filters.skip || 0,
      take: filters.take || 50,
      include: { bankAccount: true }
    });
  }

  async getStatement(user: AuthUser, statementId: string) {
    const statement = await this.prisma.bankStatement.findFirst({
      where: { id: statementId, companyId: user.companyId },
      include: { bankAccount: true, lines: true }
    });
    if (!statement) throw new NotFoundException("Statement not found");
    return statement;
  }

  async createStatement(
    user: AuthUser,
    input: {
      bankAccountId: string;
      periodFrom: Date;
      periodTo: Date;
      openingBalance: number;
      closingBalance: number;
    }
  ) {
    const account = await this.prisma.bankAccount.findFirst({
      where: { id: input.bankAccountId, companyId: user.companyId }
    });
    if (!account) throw new BadRequestException("Bank account not found");

    if (input.periodTo < input.periodFrom) {
      throw new BadRequestException("Invalid statement period");
    }

    return this.prisma.bankStatement.create({
      data: {
        companyId: user.companyId,
        bankAccountId: input.bankAccountId,
        periodFrom: input.periodFrom,
        periodTo: input.periodTo,
        openingBalance: new Prisma.Decimal(input.openingBalance),
        closingBalance: new Prisma.Decimal(input.closingBalance)
      }
    });
  }

  async addStatementLine(
    user: AuthUser,
    statementId: string,
    input: { date: Date; description?: string; amount: number; debitCredit: "debit" | "credit" }
  ) {
    const statement = await this.prisma.bankStatement.findFirst({
      where: { id: statementId, companyId: user.companyId }
    });
    if (!statement) throw new NotFoundException("Statement not found");

    return this.prisma.bankStatementLine.create({
      data: {
        companyId: user.companyId,
        statementId: statement.id,
        date: input.date,
        description: input.description,
        amount: new Prisma.Decimal(input.amount),
        debitCredit: input.debitCredit
      }
    });
  }

  async reconcile(
    user: AuthUser,
    input: { statementLineId: string; voucherId: string; voucherLineId?: string }
  ) {
    const line = await this.prisma.bankStatementLine.findFirst({
      where: { id: input.statementLineId, companyId: user.companyId }
    });
    if (!line) throw new NotFoundException("Statement line not found");
    if (line.matchedVoucherId) throw new ForbiddenException("Line already matched");

    const voucher = await this.prisma.voucher.findFirst({
      where: { id: input.voucherId, companyId: user.companyId }
    });
    if (!voucher) throw new BadRequestException("Voucher not found");
    if (voucher.status !== "posted") throw new BadRequestException("Voucher not posted");

    if (input.voucherLineId) {
      const voucherLine = await this.prisma.voucherLine.findFirst({
        where: { id: input.voucherLineId, voucherId: voucher.id, companyId: user.companyId }
      });
      if (!voucherLine) throw new BadRequestException("Voucher line not found");
    }

    return this.prisma.bankStatementLine.update({
      where: { id: line.id },
      data: {
        matchedVoucherId: voucher.id,
        matchedLineId: input.voucherLineId || null
      }
    });
  }

  async unmatch(user: AuthUser, lineId: string) {
    const line = await this.prisma.bankStatementLine.findFirst({
      where: { id: lineId, companyId: user.companyId }
    });
    if (!line) throw new NotFoundException("Statement line not found");
    if (!line.matchedVoucherId) throw new BadRequestException("Line not matched");

    return this.prisma.bankStatementLine.update({
      where: { id: line.id },
      data: {
        matchedVoucherId: null,
        matchedLineId: null
      }
    });
  }
}
