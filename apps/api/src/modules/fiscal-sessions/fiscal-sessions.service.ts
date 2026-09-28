import { Injectable, NotFoundException, BadRequestException, ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { Prisma, VoucherStatus, VoucherType } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuthUser } from "../../common/auth/auth.types";
import { adToBsDate, bsFiscalYearRangeFromStart, parseBsDate } from "../../common/date/nepali-date";
import argon2 from "argon2";
import * as speakeasy from "speakeasy";
import { decryptTotpSecret } from "../../common/auth/totp-crypto";

@Injectable()
export class FiscalSessionsService {
  constructor(private prisma: PrismaService) {}

  private async validateSessionRange(companyId: string, startDate: Date, endDate: Date, ignoreSessionId?: string) {
    const overlap = await this.prisma.fiscalSession.findFirst({
      where: {
        companyId,
        id: ignoreSessionId ? { not: ignoreSessionId } : undefined,
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });

    if (overlap) {
      throw new BadRequestException("This fiscal year overlaps with an existing fiscal year in the company.");
    }
  }

  async listSessions(user: AuthUser) {
    return this.prisma.fiscalSession.findMany({
      where: { companyId: user.companyId },
      orderBy: { startDate: "desc" },
    });
  }

  async createSession(user: AuthUser, dto: any) {
    const company = await this.prisma.company.findUnique({
      where: { id: user.companyId },
    });
    if (!company) throw new NotFoundException("Company not found");

    // Check if name already exists
    const existing = await this.prisma.fiscalSession.findUnique({
      where: { companyId_name: { companyId: user.companyId, name: dto.name } },
    });
    if (existing) throw new BadRequestException("A fiscal session with this name already exists");
    if (!(dto.startDate instanceof Date) || Number.isNaN(dto.startDate.getTime()) || !(dto.endDate instanceof Date) || Number.isNaN(dto.endDate.getTime()) || dto.startDate > dto.endDate) {
      throw new BadRequestException("Enter a valid fiscal session date range");
    }
    await this.validateSessionRange(user.companyId, dto.startDate, dto.endDate);

    const startBs = adToBsDate(dto.startDate);
    const fiscalYear = bsFiscalYearRangeFromStart(startBs);
    const endBs = fiscalYear.endDateBs;
    if (adToBsDate(dto.endDate) !== endBs) {
      throw new BadRequestException("Fiscal-year end date must match the selected start date's one-year period");
    }
    const endDate = fiscalYear.endDate;
    const fiscalYearStartMonth = parseBsDate(startBs).month;
    const invoiceSuffix = `${startBs.slice(2, 4)}/${endBs.slice(2, 4)}`;

    return this.prisma.$transaction(async (tx) => {
      const session = await tx.fiscalSession.create({
        data: {
          companyId: user.companyId,
          name: dto.name,
          startDate: dto.startDate,
          endDate,

          // Use provided overrides or fall back to company defaults
          invoicePrefix: dto.invoicePrefix ?? company.invoicePrefix,
          purchasePrefix: dto.purchasePrefix ?? company.purchasePrefix,
          salesReturnPrefix: dto.salesReturnPrefix ?? company.salesReturnPrefix,
          purchaseReturnPrefix: dto.purchaseReturnPrefix ?? company.purchaseReturnPrefix,
          orderPrefix: dto.orderPrefix ?? company.orderPrefix,
          quotationPrefix: dto.quotationPrefix ?? company.quotationPrefix,
          purchaseOrderPrefix: dto.purchaseOrderPrefix ?? company.purchaseOrderPrefix,
          receiptPrefix: dto.receiptPrefix ?? company.receiptPrefix,
          paymentPrefix: dto.paymentPrefix ?? company.paymentPrefix,
          journalPrefix: dto.journalPrefix ?? company.journalPrefix,

          invoiceSuffix,
          purchaseSuffix: dto.purchaseSuffix ?? company.purchaseSuffix,
          salesReturnSuffix: dto.salesReturnSuffix ?? company.salesReturnSuffix,
          purchaseReturnSuffix: dto.purchaseReturnSuffix ?? company.purchaseReturnSuffix,
          orderSuffix: dto.orderSuffix ?? company.orderSuffix,
          quotationSuffix: dto.quotationSuffix ?? company.quotationSuffix,
          purchaseOrderSuffix: dto.purchaseOrderSuffix ?? company.purchaseOrderSuffix,
          receiptSuffix: dto.receiptSuffix ?? company.receiptSuffix,
          paymentSuffix: dto.paymentSuffix ?? company.paymentSuffix,
          journalSuffix: dto.journalSuffix ?? company.journalSuffix,
        },
      });

      if (dto.isCurrent) {
        await tx.company.update({
          where: { id: user.companyId },
          data: { activeFiscalSessionId: session.id, fiscalYearStartMonth, invoiceSuffix },
        });
      }

      return session;
    });
  }

  async createNextFiscalYear(
    user: AuthUser,
    sessionId: string,
    dto: { name: string; startDate: string; endDate: string; lockCurrent: boolean },
  ) {
    const currentSession = await this.prisma.fiscalSession.findFirst({
      where: { id: sessionId, companyId: user.companyId },
    });
    if (!currentSession) throw new NotFoundException("Fiscal session not found");

    const nextName = dto.name.trim();
    const nextStartDate = new Date(dto.startDate);
    const requestedEndDate = new Date(dto.endDate);
    if (!nextName || Number.isNaN(nextStartDate.getTime()) || Number.isNaN(requestedEndDate.getTime())) {
      throw new BadRequestException("Enter a fiscal-year name and valid start and end dates");
    }

    const expectedStartDate = new Date(currentSession.endDate);
    expectedStartDate.setUTCDate(expectedStartDate.getUTCDate() + 1);
    if (nextStartDate.toISOString().slice(0, 10) !== expectedStartDate.toISOString().slice(0, 10)) {
      throw new BadRequestException("The next fiscal year must start the day after the current fiscal year ends");
    }

    const startBs = adToBsDate(nextStartDate);
    const nextRange = bsFiscalYearRangeFromStart(startBs);
    const nextEndDate = nextRange.endDate;
    const nextEndBs = nextRange.endDateBs;
    if (adToBsDate(requestedEndDate) !== nextEndBs) {
      throw new BadRequestException("The end date must match the selected fiscal-year period");
    }

    await this.validateSessionRange(user.companyId, nextStartDate, nextEndDate);

    const existing = await this.prisma.fiscalSession.findUnique({
      where: { companyId_name: { companyId: user.companyId, name: nextName } },
    });
    if (existing) {
      throw new BadRequestException("A fiscal session with this name already exists");
    }

    return this.prisma.$transaction(async (tx) => {
      const nextSession = await tx.fiscalSession.create({
        data: {
          companyId: user.companyId,
          name: nextName,
          startDate: nextStartDate,
          endDate: nextEndDate,
          isLocked: false,
          invoicePrefix: currentSession.invoicePrefix,
          purchasePrefix: currentSession.purchasePrefix,
          salesReturnPrefix: currentSession.salesReturnPrefix,
          purchaseReturnPrefix: currentSession.purchaseReturnPrefix,
          orderPrefix: currentSession.orderPrefix,
          quotationPrefix: currentSession.quotationPrefix,
          purchaseOrderPrefix: currentSession.purchaseOrderPrefix,
          receiptPrefix: currentSession.receiptPrefix,
          paymentPrefix: currentSession.paymentPrefix,
          journalPrefix: currentSession.journalPrefix,
          invoiceSuffix: `${startBs.slice(2, 4)}/${nextEndBs.slice(2, 4)}`,
          purchaseSuffix: currentSession.purchaseSuffix,
          salesReturnSuffix: currentSession.salesReturnSuffix,
          purchaseReturnSuffix: currentSession.purchaseReturnSuffix,
          orderSuffix: currentSession.orderSuffix,
          quotationSuffix: currentSession.quotationSuffix,
          purchaseOrderSuffix: currentSession.purchaseOrderSuffix,
          receiptSuffix: currentSession.receiptSuffix,
          paymentSuffix: currentSession.paymentSuffix,
          journalSuffix: currentSession.journalSuffix,
        },
      });

      await tx.company.update({
        where: { id: user.companyId },
        data: {
          activeFiscalSessionId: nextSession.id,
          fiscalYearStartMonth: parseBsDate(startBs).month,
          invoiceSuffix: nextSession.invoiceSuffix,
        },
      });

      const balances = await tx.voucherLine.groupBy({
        by: ["accountId"],
        where: {
          companyId: user.companyId,
          voucher: {
            companyId: user.companyId,
            fiscalSessionId: currentSession.id,
            status: VoucherStatus.posted,
          },
        },
        _sum: { debit: true, credit: true },
      });

      const accountIds = balances.map((balance) => balance.accountId).filter((id): id is string => Boolean(id));
      const accounts = await tx.chartOfAccount.findMany({
        where: { companyId: user.companyId, id: { in: accountIds } },
        select: { id: true, type: true },
      });
      const accountTypes = new Map(accounts.map((account) => [account.id, account.type]));
      const openingBalances = new Map<string, Prisma.Decimal>();
      let profitAndLossNet = new Prisma.Decimal(0);

      for (const balance of balances) {
        if (!balance.accountId) continue;
        const debit = balance._sum.debit ?? new Prisma.Decimal(0);
        const credit = balance._sum.credit ?? new Prisma.Decimal(0);
        const net = debit.sub(credit);
        if (net.equals(new Prisma.Decimal(0))) continue;
        const accountType = accountTypes.get(balance.accountId);
        if (!accountType) throw new BadRequestException("A fiscal-year balance references an unavailable account");
        if (accountType === "income" || accountType === "expense") {
          profitAndLossNet = profitAndLossNet.add(net);
        } else {
          openingBalances.set(balance.accountId, net);
        }
      }

      if (!profitAndLossNet.equals(new Prisma.Decimal(0))) {
        const retainedEarnings = await tx.chartOfAccount.findFirst({
          where: {
            companyId: user.companyId,
            type: "equity",
            isActive: true,
            isPostable: true,
            OR: [
              { code: "2200" },
              { name: { equals: "Retained Earnings", mode: "insensitive" } },
            ],
          },
          select: { id: true },
        });
        if (!retainedEarnings) {
          throw new BadRequestException("Cannot close this fiscal year because no Retained Earnings account is configured");
        }
        openingBalances.set(
          retainedEarnings.id,
          (openingBalances.get(retainedEarnings.id) ?? new Prisma.Decimal(0)).add(profitAndLossNet),
        );
      }

      const openingLines = [...openingBalances.entries()]
        .filter(([, net]) => !net.equals(new Prisma.Decimal(0)))
        .map(([accountId, net], index) => ({
          companyId: user.companyId,
          lineNo: index + 1,
          accountId,
          description: `Opening balance from ${currentSession.name}`,
          debit: net.gt(0) ? net : new Prisma.Decimal(0),
          credit: net.lt(0) ? net.abs() : new Prisma.Decimal(0),
          qty: new Prisma.Decimal(0),
          taxCodeId: null,
          taxAmount: new Prisma.Decimal(0),
        }));

      const openingDebit = openingLines.reduce((sum, line) => sum.add(line.debit), new Prisma.Decimal(0));
      const openingCredit = openingLines.reduce((sum, line) => sum.add(line.credit), new Prisma.Decimal(0));
      if (!openingDebit.equals(openingCredit)) {
        throw new BadRequestException("The current fiscal year trial balance is not balanced; rollover was cancelled");
      }

      if (openingLines.length > 0) {
        const openingVoucher = await tx.voucher.create({
          data: {
            companyId: user.companyId,
            voucherType: VoucherType.opening,
            status: VoucherStatus.posted,
            voucherDate: nextStartDate,
            voucherNumber: `OB-${nextSession.id}`,
            memo: `Opening balances carried forward from ${currentSession.name}`,
            postedAt: new Date(),
            postedByUserId: user.sub,
            fiscalSessionId: nextSession.id,
          },
        });
        await tx.voucherLine.createMany({
          data: openingLines.map((line) => ({ ...line, voucherId: openingVoucher.id })),
        });
      }

      const stockRows = await tx.stockLedger.groupBy({
        by: ["itemId"],
        where: {
          companyId: user.companyId,
          date: { gte: currentSession.startDate, lte: currentSession.endDate },
        },
        _sum: { qtyIn: true, qtyOut: true, amount: true },
      });

      for (const row of stockRows) {
        if (!row.itemId) continue;
        const qtyIn = row._sum.qtyIn ?? new Prisma.Decimal(0);
        const qtyOut = row._sum.qtyOut ?? new Prisma.Decimal(0);
        const closingQty = qtyIn.sub(qtyOut);
        if (closingQty.lte(0)) continue;

        const totalAmount = row._sum.amount ?? new Prisma.Decimal(0);
        const rate = totalAmount.div(closingQty);
        const stockOpening = await tx.stockLedger.create({
          data: {
            companyId: user.companyId,
            itemId: row.itemId,
            date: nextStartDate,
            voucherId: null,
            sourceDocumentType: "opening",
            sourceDocumentId: nextSession.id,
            qtyIn: closingQty,
            qtyOut: new Prisma.Decimal(0),
            rate,
            amount: totalAmount,
            warehouseId: null,
            binId: null,
            batchNo: null,
            lotNo: null,
            expiryDate: null,
            expiryDateBs: null,
          },
        });

        const inventoryLayer = (tx as any).inventoryLayer;
        if (inventoryLayer) {
          await inventoryLayer.create({
            data: {
              companyId: user.companyId,
              itemId: row.itemId,
              sourceLedgerId: stockOpening.id,
              sourceVoucherId: null,
              sourceType: "opening",
              warehouseId: null,
              binId: null,
              batchNo: null,
              lotNo: null,
              expiryDate: null,
              expiryDateBs: null,
              receivedDate: nextStartDate,
              qtyIn: closingQty,
              remainingQty: closingQty,
              unitCost: rate,
              totalCost: totalAmount,
            },
          });
        }
      }

      if (dto.lockCurrent) {
        await tx.fiscalSession.update({
          where: { id: currentSession.id },
          data: {
            isLocked: true,
            lockChangedAt: new Date(),
            lockChangedByUserId: user.sub,
            lockReason: "Closed and rolled into next fiscal year",
          },
        });
      }

      return nextSession;
    });
  }

  async switchSession(user: AuthUser, sessionId: string) {
    const session = await this.prisma.fiscalSession.findFirst({
      where: { id: sessionId, companyId: user.companyId },
    });
    if (!session) throw new NotFoundException("Fiscal session not found");
    if (session.isLocked) {
      throw new ForbiddenException("This fiscal session is locked and cannot be activated.");
    }

    const startBs = adToBsDate(session.startDate);
    const endBs = adToBsDate(session.endDate);
    const fiscalYearStartMonth = parseBsDate(startBs).month;
    const invoiceSuffix = session.invoiceSuffix || `${startBs.slice(2, 4)}/${endBs.slice(2, 4)}`;

    await this.prisma.company.update({
      where: { id: user.companyId },
      data: { activeFiscalSessionId: session.id, fiscalYearStartMonth, invoiceSuffix },
    });

    return { success: true, activeFiscalSessionId: session.id };
  }

  async lockSession(user: AuthUser, sessionId: string, dto: { lock: boolean; reason: string; password?: string; totpCode?: string }) {
    const session = await this.prisma.fiscalSession.findFirst({
      where: { id: sessionId, companyId: user.companyId },
    });
    if (!session) throw new NotFoundException("Fiscal session not found");

    if (session.isLocked === dto.lock) return session;

    if (!dto.lock) {
      const actor = await this.prisma.user.findUnique({
        where: { id: user.sub },
        select: { companyId: true, passwordHash: true, totpEnabled: true, totpSecretEnc: true }
      });
      if (!actor || actor.companyId !== user.companyId || !(await argon2.verify(actor.passwordHash, dto.password ?? ""))) {
        throw new UnauthorizedException("Password confirmation failed");
      }
      if (actor.totpEnabled) {
        const validTotp = Boolean(actor.totpSecretEnc && dto.totpCode && /^\d{6}$/.test(dto.totpCode) && speakeasy.totp.verify({
          secret: decryptTotpSecret(actor.totpSecretEnc!),
          encoding: "base32",
          token: dto.totpCode!,
          window: 1
        }));
        if (!validTotp) throw new UnauthorizedException("A valid authenticator code is required to unlock this year");
      }
    }

    return this.prisma.fiscalSession.update({
      where: { id: sessionId },
      data: {
        isLocked: dto.lock,
        lockChangedAt: new Date(),
        lockChangedByUserId: user.sub,
        lockReason: dto.reason.trim(),
      },
    });
  }

  async findSessionByDate(companyId: string, date: Date) {
    return this.prisma.fiscalSession.findFirst({
      where: {
        companyId,
        startDate: { lte: date },
        endDate: { gte: date },
      },
    });
  }

  async getActiveSession(user: AuthUser) {
    const company = await this.prisma.company.findUnique({
      where: { id: user.companyId },
      select: { activeFiscalSessionId: true },
    });
    if (!company?.activeFiscalSessionId) return null;
    return this.prisma.fiscalSession.findUnique({
      where: { id: company.activeFiscalSessionId },
    });
  }

  async initActiveSession(companyId: string) {
    const today = new Date();
    const session = await this.findSessionByDate(companyId, today);

    if (session) {
      await this.prisma.company.update({
        where: { id: companyId },
        data: { activeFiscalSessionId: session.id },
      });
      return session.id;
    }
    return null;
  }
}
