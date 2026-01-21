import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma, VoucherStatus, VoucherType } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getStock(user: AuthUser, itemId: string, filters: { from?: Date; to?: Date }) {
    const item = await this.prisma.item.findFirst({
      where: { id: itemId, companyId: user.companyId }
    });
    if (!item) throw new BadRequestException("Item not found");

    const where: Prisma.StockLedgerWhereInput = { companyId: user.companyId, itemId };
    if (filters.from || filters.to) {
      where.date = {};
      if (filters.from) (where.date as Prisma.DateTimeFilter).gte = filters.from;
      if (filters.to) (where.date as Prisma.DateTimeFilter).lte = filters.to;
    }

    const entries = await this.prisma.stockLedger.findMany({
      where,
      orderBy: { date: "asc" }
    });

    let qty = new Prisma.Decimal(0);
    for (const e of entries) {
      qty = qty.add(e.qtyIn).sub(e.qtyOut);
    }

    return { itemId, qty, entries };
  }

  async adjustStock(
    user: AuthUser,
    input: { itemId: string; date: Date; qty: number; rate?: number; accountId: string; memo?: string }
  ) {
    const item = await this.prisma.item.findFirst({
      where: { id: input.itemId, companyId: user.companyId }
    });
    if (!item) throw new BadRequestException("Item not found");

    const account = await this.prisma.chartOfAccount.findFirst({
      where: { id: input.accountId, companyId: user.companyId }
    });
    if (!account) throw new BadRequestException("Account not found");

    const inventoryAccountId = item.expenseAccountId || item.incomeAccountId;
    if (!inventoryAccountId) throw new BadRequestException("Item missing inventory account");

    const qty = new Prisma.Decimal(input.qty);
    if (qty.equals(0)) throw new BadRequestException("Quantity cannot be zero");
    const rate = new Prisma.Decimal(input.rate ?? 0);
    const amount = qty.abs().mul(rate);

    return this.prisma.$transaction(async (tx) => {
      const voucher = await tx.voucher.create({
        data: {
          companyId: user.companyId,
          voucherType: VoucherType.journal,
          status: VoucherStatus.posted,
          voucherDate: input.date,
          memo: input.memo || "Stock adjustment",
          postedAt: new Date(),
          postedByUserId: user.sub,
          lines: {
            create: qty.gt(0)
              ? [
                  {
                    companyId: user.companyId,
                    lineNo: 1,
                    accountId: inventoryAccountId,
                    debit: amount,
                    credit: new Prisma.Decimal(0),
                    description: "Stock increase"
                  },
                  {
                    companyId: user.companyId,
                    lineNo: 2,
                    accountId: account.id,
                    debit: new Prisma.Decimal(0),
                    credit: amount,
                    description: "Stock increase offset"
                  }
                ]
              : [
                  {
                    companyId: user.companyId,
                    lineNo: 1,
                    accountId: account.id,
                    debit: new Prisma.Decimal(0),
                    credit: amount,
                    description: "Stock decrease"
                  },
                  {
                    companyId: user.companyId,
                    lineNo: 2,
                    accountId: inventoryAccountId,
                    debit: amount,
                    credit: new Prisma.Decimal(0),
                    description: "Stock decrease offset"
                  }
                ]
          }
        }
      });

      await tx.stockLedger.create({
        data: {
          companyId: user.companyId,
          itemId: item.id,
          date: input.date,
          voucherId: voucher.id,
          qtyIn: qty.gt(0) ? qty : new Prisma.Decimal(0),
          qtyOut: qty.lt(0) ? qty.abs() : new Prisma.Decimal(0),
          rate,
          amount
        }
      });

      return { ok: true, voucherId: voucher.id };
    });
  }
}
