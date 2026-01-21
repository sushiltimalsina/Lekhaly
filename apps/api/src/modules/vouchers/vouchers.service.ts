import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, VoucherStatus, VoucherType } from "@prisma/client";
import type { ChartOfAccount, Item, Party, TaxCode } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";
import crypto from "crypto";

type DraftInput = {
  voucherType?: VoucherType;
  voucherDate?: Date;
  partyId?: string;
  memo?: string;
  lines?: Array<{
    accountId: string;
    partyId?: string;
    itemId?: string;
    description?: string;
    debit?: number;
    credit?: number;
    taxCodeId?: string;
    taxAmount?: number;
  }>;
};

type TaxLineInput = {
  lineNo: number;
  accountId: string;
  description?: string;
  debit: Prisma.Decimal;
  credit: Prisma.Decimal;
  taxCodeId?: string;
  taxAmount?: Prisma.Decimal;
};

@Injectable()
export class VouchersService {
  constructor(private prisma: PrismaService) {}

  private enforceVoucherRules(voucherType: VoucherType, partyId?: string | null) {
    const requiresParty: VoucherType[] = [
      VoucherType.sales_invoice,
      VoucherType.sales_return,
      VoucherType.purchase,
      VoucherType.purchase_return,
      VoucherType.receipt,
      VoucherType.payment
    ];
    const forbidsParty: VoucherType[] = [
      VoucherType.journal,
      VoucherType.opening,
      VoucherType.reversal
    ];

    if (requiresParty.includes(voucherType) && !partyId) {
      throw new BadRequestException("Party is required for this voucher type");
    }
    if (forbidsParty.includes(voucherType) && partyId) {
      throw new BadRequestException("Party is not allowed for this voucher type");
    }
  }

  private toJsonSafe(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  private async idempotencyGuard(
    user: AuthUser,
    action: string,
    idempotencyKey?: string,
    payload?: unknown
  ): Promise<{ kind: "existing"; response: Prisma.JsonValue } | { kind: "new"; requestHash: string | null } | null> {
    if (!idempotencyKey) return null;

    const requestHash = payload
      ? crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex")
      : null;

    const existing = await this.prisma.apiIdempotency.findUnique({
      where: {
        companyId_key_action: {
          companyId: user.companyId,
          key: idempotencyKey,
          action
        }
      }
    });
    if (existing) {
      if (requestHash && existing.requestHash && existing.requestHash !== requestHash) {
        throw new ConflictException("Idempotency key reused with different payload");
      }
      return { kind: "existing", response: existing.responseJson };
    }

    return { kind: "new", requestHash };
  }

  private async storeIdempotency(
    user: AuthUser,
    action: string,
    idempotencyKey: string,
    requestHash: string | null,
    responseJson: Prisma.InputJsonValue
  ) {
    await this.prisma.apiIdempotency.create({
      data: {
        companyId: user.companyId,
        userId: user.sub,
        key: idempotencyKey,
        action,
        requestHash,
        responseJson
      }
    });
  }

  private async getCompanyOrThrow(companyId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new BadRequestException("Company not found");
    return company;
  }

  private ensureVoucherDate(company: { lockDate: Date | null }, voucherDate: Date) {
    if (company.lockDate && voucherDate <= company.lockDate) {
      throw new BadRequestException("Voucher date is locked");
    }
  }

  private async validateReferences(companyId: string, input: DraftInput, voucherType?: VoucherType) {
    const partyIds = new Set<string>();
    const accountIds = new Set<string>();
    const itemIds = new Set<string>();
    const taxCodeIds = new Set<string>();

    if (input.partyId) partyIds.add(input.partyId);
    for (const line of input.lines || []) {
      accountIds.add(line.accountId);
      if (line.partyId) partyIds.add(line.partyId);
      if (line.itemId) itemIds.add(line.itemId);
      if (line.taxCodeId) taxCodeIds.add(line.taxCodeId);
    }

    const [accounts, parties, items, taxCodes] = await Promise.all([
      accountIds.size
        ? this.prisma.chartOfAccount.findMany({
            where: { id: { in: Array.from(accountIds) }, companyId }
          })
        : Promise.resolve([] as ChartOfAccount[]),
      partyIds.size
        ? this.prisma.party.findMany({ where: { id: { in: Array.from(partyIds) }, companyId } })
        : Promise.resolve([] as Party[]),
      itemIds.size
        ? this.prisma.item.findMany({ where: { id: { in: Array.from(itemIds) }, companyId } })
        : Promise.resolve([] as Item[]),
      taxCodeIds.size
        ? this.prisma.taxCode.findMany({ where: { id: { in: Array.from(taxCodeIds) }, companyId } })
        : Promise.resolve([] as TaxCode[])
    ]);

    if (accounts.length !== accountIds.size) throw new BadRequestException("Invalid account");
    if (parties.length !== partyIds.size) throw new BadRequestException("Invalid party");
    if (items.length !== itemIds.size) throw new BadRequestException("Invalid item");
    if (taxCodes.length !== taxCodeIds.size) throw new BadRequestException("Invalid tax code");

    if (accounts.some((a) => !a.isActive || !a.isPostable)) {
      throw new BadRequestException("Account not postable");
    }

    if (voucherType && itemIds.size) {
      const itemMap = new Map(items.map((i) => [i.id, i]));
      for (const line of input.lines || []) {
        if (!line.itemId) continue;
        const item = itemMap.get(line.itemId);
        if (!item) throw new BadRequestException("Invalid item");
        if (
          voucherType === VoucherType.sales_invoice ||
          voucherType === VoucherType.sales_return ||
          voucherType === VoucherType.receipt
        ) {
          if (!item.incomeAccountId) throw new BadRequestException("Item missing income account");
          if (item.incomeAccountId !== line.accountId) {
            throw new BadRequestException("Item income account mismatch");
          }
        }
        if (voucherType === VoucherType.payment || voucherType === VoucherType.purchase || voucherType === VoucherType.purchase_return) {
          if (!item.expenseAccountId) throw new BadRequestException("Item missing expense account");
          if (item.expenseAccountId !== line.accountId) {
            throw new BadRequestException("Item expense account mismatch");
          }
        }
      }
    }
  }

  private async buildTaxLines(
    companyId: string,
    voucherType: VoucherType,
    lines: Array<{
      lineNo: number;
      accountId: string;
      debit: Prisma.Decimal;
      credit: Prisma.Decimal;
      taxCodeId?: string;
      taxAmount?: Prisma.Decimal;
    }>
  ): Promise<TaxLineInput[]> {
    const taxCodeIds = Array.from(new Set(lines.map((l) => l.taxCodeId).filter(Boolean))) as string[];
    if (taxCodeIds.length === 0) return [];

    if (
      voucherType === VoucherType.journal ||
      voucherType === VoucherType.opening ||
      voucherType === VoucherType.reversal
    ) {
      throw new BadRequestException("Tax codes are not allowed for this voucher type");
    }

    const taxCodes = await this.prisma.taxCode.findMany({
      where: { id: { in: taxCodeIds }, companyId }
    });
    const taxMap = new Map(taxCodes.map((t) => [t.id, t]));
    const accountIds = new Set<string>();

    const result: TaxLineInput[] = [];
    let nextLineNo = Math.max(...lines.map((l) => l.lineNo), 0) + 1;

    for (const line of lines) {
      if (!line.taxCodeId) continue;
      const taxCode = taxMap.get(line.taxCodeId);
      if (!taxCode) throw new BadRequestException("Invalid tax code");
      const taxAmount = line.taxAmount ? new Prisma.Decimal(line.taxAmount) : new Prisma.Decimal(0);
      if (taxAmount.lte(0)) throw new BadRequestException("Tax amount must be greater than zero");

      if (
        voucherType === VoucherType.sales_invoice ||
        voucherType === VoucherType.receipt ||
        voucherType === VoucherType.purchase_return
      ) {
        if (line.credit.lte(0)) {
          throw new BadRequestException("Tax on sales must be on credit lines");
        }
        if (!taxCode.outputTaxAccountId) throw new BadRequestException("Tax code missing output account");
        accountIds.add(taxCode.outputTaxAccountId);
        result.push({
          lineNo: nextLineNo++,
          accountId: taxCode.outputTaxAccountId,
          description: "Tax",
          debit: new Prisma.Decimal(0),
          credit: taxAmount,
          taxCodeId: taxCode.id,
          taxAmount
        });
      }

      if (voucherType === VoucherType.payment || voucherType === VoucherType.purchase || voucherType === VoucherType.sales_return) {
        if (line.debit.lte(0)) {
          throw new BadRequestException("Tax on purchases must be on debit lines");
        }
        if (!taxCode.inputTaxAccountId) throw new BadRequestException("Tax code missing input account");
        accountIds.add(taxCode.inputTaxAccountId);
        result.push({
          lineNo: nextLineNo++,
          accountId: taxCode.inputTaxAccountId,
          description: "Tax",
          debit: taxAmount,
          credit: new Prisma.Decimal(0),
          taxCodeId: taxCode.id,
          taxAmount
        });
      }
    }

    if (accountIds.size) {
      const accounts = await this.prisma.chartOfAccount.findMany({
        where: { id: { in: Array.from(accountIds) }, companyId }
      });
      if (accounts.length !== accountIds.size) throw new BadRequestException("Invalid tax account");
      if (accounts.some((a) => !a.isActive || !a.isPostable)) {
        throw new BadRequestException("Tax account not postable");
      }
    }

    return result;
  }

  private normalizeLines(lines: NonNullable<DraftInput["lines"]>) {
    if (lines.length === 0) throw new BadRequestException("Lines required");
    return lines.map((line, idx) => {
      const debit = Number(line.debit || 0);
      const credit = Number(line.credit || 0);
      if (debit < 0 || credit < 0) throw new BadRequestException("Negative amounts not allowed");
      if ((debit > 0 && credit > 0) || (debit === 0 && credit === 0)) {
        throw new BadRequestException("Each line must have either debit or credit");
      }
      return {
        lineNo: idx + 1,
        accountId: line.accountId,
        partyId: line.partyId,
        itemId: line.itemId,
        description: line.description,
        debit: new Prisma.Decimal(debit),
        credit: new Prisma.Decimal(credit),
        taxCodeId: line.taxCodeId,
        taxAmount: new Prisma.Decimal(line.taxAmount || 0)
      };
    });
  }

  private computeTotals(lines: { debit: Prisma.Decimal; credit: Prisma.Decimal }[]) {
    let debit = new Prisma.Decimal(0);
    let credit = new Prisma.Decimal(0);
    for (const line of lines) {
      debit = debit.add(line.debit);
      credit = credit.add(line.credit);
    }
    return { debit, credit };
  }

  async createDraft(user: AuthUser, input: DraftInput, idempotencyKey?: string) {
    if (!input.voucherType || !input.voucherDate || !input.lines) {
      throw new BadRequestException("Missing draft fields");
    }
    if (input.voucherType === VoucherType.reversal) {
      throw new BadRequestException("Reversal vouchers can only be created by void");
    }
    this.enforceVoucherRules(input.voucherType, input.partyId);

    const guard = await this.idempotencyGuard(user, "voucher.createDraft", idempotencyKey, input);
    if (guard?.kind === "existing") {
      return guard.response;
    }

    const company = await this.getCompanyOrThrow(user.companyId);
    this.ensureVoucherDate(company, input.voucherDate);
    await this.validateReferences(user.companyId, input, input.voucherType);
    const lines = this.normalizeLines(input.lines);

    const voucher = await this.prisma.voucher.create({
      data: {
        companyId: user.companyId,
        voucherType: input.voucherType,
        status: VoucherStatus.draft,
        voucherDate: input.voucherDate,
        partyId: input.partyId,
        memo: input.memo,
        createdByUserId: user.sub,
        lines: {
          create: lines.map((l) => ({ ...l, companyId: user.companyId }))
        }
      },
      include: { lines: true }
    });

    if (idempotencyKey && guard?.kind === "new") {
      await this.storeIdempotency(
        user,
        "voucher.createDraft",
        idempotencyKey,
        guard.requestHash,
        this.toJsonSafe(voucher)
      );
    }

    return voucher;
  }

  async updateDraft(user: AuthUser, voucherId: string, input: DraftInput) {
    const voucher = await this.prisma.voucher.findFirst({
      where: { id: voucherId, companyId: user.companyId }
    });
    if (!voucher) throw new NotFoundException("Voucher not found");
    if (voucher.status !== VoucherStatus.draft) throw new ForbiddenException("Only draft vouchers can be edited");
    if (input.voucherType === VoucherType.reversal) {
      throw new BadRequestException("Reversal vouchers can only be created by void");
    }
    const nextType = input.voucherType ?? voucher.voucherType;
    const nextParty =
      input.partyId !== undefined ? input.partyId : voucher.partyId ? voucher.partyId : undefined;
    this.enforceVoucherRules(nextType, nextParty);

    const data: Prisma.VoucherUpdateInput = {};
    if (input.voucherType) data.voucherType = input.voucherType;
    if (input.voucherDate) data.voucherDate = input.voucherDate;
    if (input.partyId !== undefined) {
      data.party = input.partyId ? { connect: { id: input.partyId } } : { disconnect: true };
    }
    if (input.memo !== undefined) data.memo = input.memo;

    return this.prisma.$transaction(async (tx) => {
      const company = await this.getCompanyOrThrow(user.companyId);
      if (input.voucherDate) this.ensureVoucherDate(company, input.voucherDate);
      if (input.lines || input.partyId) await this.validateReferences(user.companyId, input, nextType);

      if (input.lines) {
        const lines = this.normalizeLines(input.lines);
        await tx.voucherLine.deleteMany({ where: { voucherId: voucher.id } });
        await tx.voucherLine.createMany({
          data: lines.map((l) => ({ ...l, voucherId: voucher.id, companyId: user.companyId }))
        });
      }

      const updated = await tx.voucher.update({
        where: { id: voucher.id },
        data
      });

      return tx.voucher.findUnique({ where: { id: updated.id }, include: { lines: true } });
    });
  }

  async preview(user: AuthUser, voucherId: string) {
    const voucher = await this.prisma.voucher.findFirst({
      where: { id: voucherId, companyId: user.companyId },
      include: { lines: true }
    });
    if (!voucher) throw new NotFoundException("Voucher not found");

    const normalized = voucher.lines.map((l) => ({
      lineNo: l.lineNo,
      accountId: l.accountId,
      debit: l.debit,
      credit: l.credit,
      taxCodeId: l.taxCodeId || undefined,
      taxAmount: l.taxAmount
    }));
    const taxLines = await this.buildTaxLines(user.companyId, voucher.voucherType, normalized);
    const totals = this.computeTotals(
      [...normalized, ...taxLines].map((l) => ({ debit: l.debit, credit: l.credit }))
    );
    const balanced = totals.debit.equals(totals.credit);

    return {
      voucherId: voucher.id,
      status: voucher.status,
      totalDebit: totals.debit,
      totalCredit: totals.credit,
      balanced
    };
  }

  async post(user: AuthUser, voucherId: string, idempotencyKey?: string) {
    const guard = await this.idempotencyGuard(user, "voucher.post", idempotencyKey, { voucherId });
    if (guard?.kind === "existing") {
      return guard.response;
    }

    return this.prisma.$transaction(async (tx) => {
      const voucher = await tx.voucher.findFirst({
        where: { id: voucherId, companyId: user.companyId },
        include: { lines: true }
      });
      if (!voucher) throw new NotFoundException("Voucher not found");
      if (voucher.status !== VoucherStatus.draft) throw new ForbiddenException("Only draft vouchers can be posted");
      if (voucher.lines.length === 0) throw new BadRequestException("Voucher has no lines");
      this.enforceVoucherRules(voucher.voucherType, voucher.partyId);

      const normalized = voucher.lines.map((l) => ({
        lineNo: l.lineNo,
        accountId: l.accountId,
        debit: l.debit,
        credit: l.credit,
        taxCodeId: l.taxCodeId || undefined,
        taxAmount: l.taxAmount
      }));
      const taxLines = await this.buildTaxLines(user.companyId, voucher.voucherType, normalized);
      const totals = this.computeTotals(
        [...normalized, ...taxLines].map((l) => ({ debit: l.debit, credit: l.credit }))
      );
      if (!totals.debit.equals(totals.credit)) throw new BadRequestException("Voucher not balanced");

      const company = await tx.company.findUnique({ where: { id: user.companyId } });
      if (!company) throw new BadRequestException("Company not found");
      this.ensureVoucherDate(company, voucher.voucherDate);

      await this.validateReferences(user.companyId, {
        partyId: voucher.partyId || undefined,
        lines: voucher.lines.map((l) => ({
          accountId: l.accountId,
          partyId: l.partyId || undefined,
          itemId: l.itemId || undefined,
          taxCodeId: l.taxCodeId || undefined
        }))
      }, voucher.voucherType);

      const sequence = company.nextInvoiceNumber;
      const prefix =
        voucher.voucherType === VoucherType.sales_invoice
          ? company.invoicePrefix
          : voucher.voucherType.replace("_", "-").toUpperCase();
      const voucherNumber = `${prefix}-${sequence}`;

      const posted = await tx.voucher.update({
        where: { id: voucher.id },
        data: {
          status: VoucherStatus.posted,
          postedAt: new Date(),
          postedByUserId: user.sub,
          voucherNumber
        }
      });

      await tx.company.update({
        where: { id: company.id },
        data: { nextInvoiceNumber: sequence + 1 }
      });

      if (taxLines.length) {
        await tx.voucherLine.createMany({
          data: taxLines.map((l) => ({
            voucherId: voucher.id,
            companyId: user.companyId,
            lineNo: l.lineNo,
            accountId: l.accountId,
            description: l.description,
            debit: l.debit,
            credit: l.credit,
            taxCodeId: l.taxCodeId,
            taxAmount: l.taxAmount
          }))
        });
      }

      const result = await tx.voucher.findUnique({ where: { id: posted.id }, include: { lines: true } });
      if (idempotencyKey && guard?.kind === "new" && result) {
        await tx.apiIdempotency.create({
          data: {
            companyId: user.companyId,
            userId: user.sub,
            key: idempotencyKey,
            action: "voucher.post",
            requestHash: guard.requestHash,
            responseJson: this.toJsonSafe(result)
          }
        });
      }
      return result;
    });
  }

  async void(user: AuthUser, voucherId: string, idempotencyKey?: string) {
    const guard = await this.idempotencyGuard(user, "voucher.void", idempotencyKey, { voucherId });
    if (guard?.kind === "existing") {
      return guard.response;
    }

    return this.prisma.$transaction(async (tx) => {
      const voucher = await tx.voucher.findFirst({
        where: { id: voucherId, companyId: user.companyId },
        include: { lines: true }
      });
      if (!voucher) throw new NotFoundException("Voucher not found");
      if (voucher.status !== VoucherStatus.posted) throw new ForbiddenException("Only posted vouchers can be voided");

      const reversal = await tx.voucher.create({
        data: {
          companyId: voucher.companyId,
          voucherType: VoucherType.reversal,
          status: VoucherStatus.posted,
          voucherDate: new Date(),
          partyId: voucher.partyId,
          memo: `Reversal of ${voucher.voucherNumber || voucher.id}`,
          postedAt: new Date(),
          postedByUserId: user.sub,
          reversalOfVoucherId: voucher.id,
          lines: {
            create: voucher.lines.map((l, idx) => ({
              companyId: voucher.companyId,
              lineNo: idx + 1,
              accountId: l.accountId,
              partyId: l.partyId,
              itemId: l.itemId,
              description: l.description,
              debit: l.credit,
              credit: l.debit,
              taxCodeId: l.taxCodeId,
              taxAmount: l.taxAmount
            }))
          }
        }
      });

      await tx.voucher.update({
        where: { id: voucher.id },
        data: {
          status: VoucherStatus.void,
          voidedAt: new Date(),
          voidedByUserId: user.sub
        }
      });

      const result = { voidedVoucherId: voucher.id, reversalVoucherId: reversal.id };
      if (idempotencyKey && guard?.kind === "new") {
        await tx.apiIdempotency.create({
          data: {
            companyId: user.companyId,
            userId: user.sub,
            key: idempotencyKey,
            action: "voucher.void",
            requestHash: guard.requestHash,
            responseJson: this.toJsonSafe(result)
          }
        });
      }
      return result;
    });
  }

  async getById(user: AuthUser, voucherId: string) {
    const voucher = await this.prisma.voucher.findFirst({
      where: { id: voucherId, companyId: user.companyId },
      include: { lines: true }
    });
    if (!voucher) throw new NotFoundException("Voucher not found");
    return voucher;
  }

  async list(
    user: AuthUser,
    filters: {
      status?: VoucherStatus;
      voucherType?: VoucherType;
      partyId?: string;
      createdByUserId?: string;
      postedByUserId?: string;
      voidedByUserId?: string;
      voucherNumber?: string;
      memo?: string;
      q?: string;
      from?: Date;
      to?: Date;
      skip?: number;
      take?: number;
    }
  ) {
    const where: Prisma.VoucherWhereInput = { companyId: user.companyId };
    if (filters.status) where.status = filters.status;
    if (filters.voucherType) where.voucherType = filters.voucherType;
    if (filters.partyId) where.partyId = filters.partyId;
    if (filters.createdByUserId) where.createdByUserId = filters.createdByUserId;
    if (filters.postedByUserId) where.postedByUserId = filters.postedByUserId;
    if (filters.voidedByUserId) where.voidedByUserId = filters.voidedByUserId;
    if (filters.voucherNumber) where.voucherNumber = filters.voucherNumber;
    if (filters.memo) where.memo = { contains: filters.memo, mode: "insensitive" };
    if (filters.from || filters.to) {
      where.voucherDate = {};
      if (filters.from) (where.voucherDate as Prisma.DateTimeFilter).gte = filters.from;
      if (filters.to) (where.voucherDate as Prisma.DateTimeFilter).lte = filters.to;
    }
    if (filters.q) {
      where.OR = [
        { voucherNumber: { contains: filters.q, mode: "insensitive" } },
        { memo: { contains: filters.q, mode: "insensitive" } },
        { party: { name: { contains: filters.q, mode: "insensitive" } } }
      ];
    }

    return this.prisma.voucher.findMany({
      where,
      orderBy: [{ voucherDate: "desc" }, { createdAt: "desc" }],
      skip: filters.skip || 0,
      take: filters.take || 50,
      select: {
        id: true,
        voucherNumber: true,
        voucherDate: true,
        voucherType: true,
        status: true,
        partyId: true,
        party: { select: { id: true, name: true } },
        memo: true,
        createdAt: true,
        postedAt: true
      }
    });
  }

  async listAttachments(user: AuthUser, voucherId: string) {
    const voucher = await this.prisma.voucher.findFirst({
      where: { id: voucherId, companyId: user.companyId }
    });
    if (!voucher) throw new NotFoundException("Voucher not found");

    return this.prisma.voucherAttachment.findMany({
      where: { voucherId: voucher.id, companyId: user.companyId },
      orderBy: { createdAt: "desc" },
      include: {
        uploadedByUser: { select: { id: true, email: true, name: true } }
      }
    });
  }

  async getAttachmentUrl(user: AuthUser, voucherId: string, attachmentId: string) {
    const voucher = await this.prisma.voucher.findFirst({
      where: { id: voucherId, companyId: user.companyId }
    });
    if (!voucher) throw new NotFoundException("Voucher not found");

    const attachment = await this.prisma.voucherAttachment.findFirst({
      where: { id: attachmentId, voucherId: voucher.id, companyId: user.companyId }
    });
    if (!attachment) throw new NotFoundException("Attachment not found");

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const url = `https://files.local/${attachment.storageKey}?expires=${encodeURIComponent(
      expiresAt.toISOString()
    )}`;

    return {
      attachmentId: attachment.id,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      url,
      expiresAt
    };
  }

  async addAttachment(
    user: AuthUser,
    voucherId: string,
    input: { fileName: string; mimeType: string; sizeBytes: number; storageKey: string }
  ) {
    const voucher = await this.prisma.voucher.findFirst({
      where: { id: voucherId, companyId: user.companyId }
    });
    if (!voucher) throw new NotFoundException("Voucher not found");
    if (voucher.status === VoucherStatus.void) {
      throw new ForbiddenException("Cannot attach to void vouchers");
    }

    return this.prisma.voucherAttachment.create({
      data: {
        companyId: user.companyId,
        voucherId: voucher.id,
        uploadedByUserId: user.sub,
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        storageKey: input.storageKey
      }
    });
  }

  async removeAttachment(user: AuthUser, voucherId: string, attachmentId: string) {
    const voucher = await this.prisma.voucher.findFirst({
      where: { id: voucherId, companyId: user.companyId }
    });
    if (!voucher) throw new NotFoundException("Voucher not found");

    const attachment = await this.prisma.voucherAttachment.findFirst({
      where: { id: attachmentId, voucherId: voucher.id, companyId: user.companyId }
    });
    if (!attachment) throw new NotFoundException("Attachment not found");

    await this.prisma.voucherAttachment.delete({ where: { id: attachment.id } });
    return { id: attachment.id, deleted: true };
  }
}
