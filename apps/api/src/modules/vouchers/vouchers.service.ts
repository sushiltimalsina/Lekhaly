import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, VoucherStatus, VoucherType } from "@prisma/client";
import type { ChartOfAccount, Item, Party, TaxCode } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";
import crypto from "crypto";
import { resolveAdDate } from "../../common/date/nepali-date";
import { InventoryService } from "../inventory/inventory.service";

type DraftInput = {
  voucherType?: VoucherType;
  voucherDate?: Date;
  voucherDateBs?: string;
  partyId?: string;
  referenceNo?: string;
  vendorInvoiceNo?: string;
  vendorInvoiceDate?: Date;
  memo?: string;
  additionalNote?: string;
  lines?: Array<{
    accountId?: string;
    partyId?: string;
    itemId?: string;
    description?: string;
    debit?: number;
    credit?: number;
    qty?: number;
    taxCodeId?: string;
    taxAmount?: number;
    warehouseId?: string | null;
    binId?: string | null;
    batchNo?: string | null;
    lotNo?: string | null;
    expiryDate?: Date | null;
    expiryDateBs?: string | null;
    serialNumbers?: string[];
  }>;
};

type TaxLineInput = {
  lineNo: number;
  accountId: string;
  description?: string;
  debit: Prisma.Decimal;
  credit: Prisma.Decimal;
  qty?: Prisma.Decimal;
  taxCodeId?: string;
  taxAmount?: Prisma.Decimal;
};

type NormalizedVoucherInventoryLine = {
  warehouseId: string | null;
  binId: string | null;
  batchNo: string | null;
  lotNo: string | null;
  expiryDate: Date | null;
  expiryDateBs: string | null;
  serialNumbers: string[];
};

@Injectable()
export class VouchersService {
  constructor(
    private prisma: PrismaService,
    private inventory: InventoryService
  ) { }

  private async getInventorySettings(companyId: string, tx?: Prisma.TransactionClient) {
    const db = (tx ?? this.prisma) as any;
    const existing = await db.inventorySettings.findUnique({ where: { companyId } });
    if (existing) return existing;
    return db.inventorySettings.create({ data: { companyId } });
  }

  private parseDateOrNull(value: Date | string | null | undefined) {
    if (!value) return null;
    const dt = value instanceof Date ? value : new Date(value);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  private normalizeSerialNumbers(serialNumbers?: string[]) {
    const normalized = (serialNumbers ?? []).map((serial) => serial.trim()).filter(Boolean);
    if (new Set(normalized.map((serial) => serial.toLowerCase())).size !== normalized.length) {
      throw new BadRequestException("Duplicate serial numbers are not allowed on a line");
    }
    return normalized;
  }

  private assertSerializedLine(item: any, qty: Prisma.Decimal, serialNumbers?: string[]) {
    const serials = this.normalizeSerialNumbers(serialNumbers);
    if (!item.isSerialized) {
      if (serials.length) throw new BadRequestException("Serial numbers are only allowed for serialized items");
      return serials;
    }

    const expected = Number(qty.abs().toString());
    if (!Number.isInteger(expected)) throw new BadRequestException("Serialized item quantity must be a whole number");
    if (serials.length !== expected) {
      throw new BadRequestException(`Serialized item requires ${expected} serial number(s)`);
    }
    return serials;
  }

  private async normalizeInventoryLine(
    tx: Prisma.TransactionClient,
    companyId: string,
    settings: any,
    item: any,
    line: {
      warehouseId?: string | null;
      binId?: string | null;
      batchNo?: string | null;
      lotNo?: string | null;
      expiryDate?: Date | null;
      expiryDateBs?: string | null;
      serialNumbers?: string[];
    },
    qty: Prisma.Decimal
  ): Promise<NormalizedVoucherInventoryLine> {
    const warehouseId = line.warehouseId || settings.defaultWarehouseId || null;
    const binId = line.binId || null;
    const batchNo = line.batchNo?.trim() || null;
    const lotNo = line.lotNo?.trim() || null;
    const expiryDate = this.parseDateOrNull(line.expiryDate);
    const expiryDateBs = line.expiryDateBs?.trim() || null;

    if (item.isSerialized && !settings.serialTrackingEnabled) {
      throw new BadRequestException("Enable serial tracking in inventory configuration before posting serialized items");
    }
    if (item.isKit && !settings.kitsEnabled) {
      throw new BadRequestException("Enable kits in inventory configuration before posting kit vouchers");
    }
    if ((batchNo || item.tracksBatch) && !settings.batchTrackingEnabled) {
      throw new BadRequestException("Batch tracking is disabled in inventory configuration");
    }
    if ((lotNo || item.tracksLot) && !settings.lotTrackingEnabled) {
      throw new BadRequestException("Lot tracking is disabled in inventory configuration");
    }
    if ((expiryDate || expiryDateBs || item.tracksExpiry) && !settings.expiryTrackingEnabled) {
      throw new BadRequestException("Expiry tracking is disabled in inventory configuration");
    }
    if (warehouseId && !settings.warehousesEnabled) {
      throw new BadRequestException("Warehouse tracking is disabled in inventory configuration");
    }
    if (binId && !settings.binsEnabled) {
      throw new BadRequestException("Bin tracking is disabled in inventory configuration");
    }
    if (settings.requireWarehouseOnMovements && !warehouseId) {
      throw new BadRequestException("Warehouse is required for stock movements");
    }

    if (item.tracksBatch && !batchNo) throw new BadRequestException("Batch number is required for this item");
    if (item.tracksLot && !lotNo) throw new BadRequestException("Lot number is required for this item");
    if (item.tracksExpiry && !expiryDate && !expiryDateBs) {
      throw new BadRequestException("Expiry date is required for this item");
    }

    if (warehouseId) {
      const warehouse = await tx.warehouse.findFirst({ where: { id: warehouseId, companyId, isActive: true } });
      if (!warehouse) throw new BadRequestException("Warehouse not found");
    }
    if (binId) {
      const bin = await tx.warehouseBin.findFirst({
        where: { id: binId, companyId, warehouseId, isActive: true }
      });
      if (!bin) throw new BadRequestException("Bin not found for selected warehouse");
    }

    const serialNumbers = this.assertSerializedLine(item, qty, line.serialNumbers);
    return { warehouseId, binId, batchNo, lotNo, expiryDate, expiryDateBs, serialNumbers };
  }

  private async getScopedStock(
    tx: Prisma.TransactionClient,
    companyId: string,
    itemId: string,
    scope: NormalizedVoucherInventoryLine
  ) {
    const balance = await tx.stockLedger.aggregate({
      where: {
        companyId,
        itemId,
        warehouseId: scope.warehouseId,
        binId: scope.binId,
        batchNo: scope.batchNo ?? undefined,
        lotNo: scope.lotNo ?? undefined,
        expiryDate: scope.expiryDate ?? undefined
      },
      _sum: { qtyIn: true, qtyOut: true }
    });
    return new Prisma.Decimal(balance._sum.qtyIn ?? 0).sub(new Prisma.Decimal(balance._sum.qtyOut ?? 0));
  }

  private async ensureSerialsAvailable(
    tx: Prisma.TransactionClient,
    companyId: string,
    itemId: string,
    serialNumbers: string[],
    scope: NormalizedVoucherInventoryLine
  ) {
    if (!serialNumbers.length) return [];
    const serialRows = await tx.serialNumber.findMany({
      where: {
        companyId,
        itemId,
        serialNo: { in: serialNumbers },
        status: "available",
        warehouseId: scope.warehouseId,
        binId: scope.binId
      },
      select: { id: true, serialNo: true }
    });
    if (serialRows.length !== serialNumbers.length) {
      throw new BadRequestException("One or more serial numbers are not available at the selected location");
    }
    return serialRows;
  }

  private async allocateOutgoingByBatch(
    tx: Prisma.TransactionClient,
    companyId: string,
    itemId: string,
    requiredQty: Prisma.Decimal
  ) {
    const ledgerRows = await tx.stockLedger.findMany({
      where: { companyId, itemId },
      select: {
        date: true,
        qtyIn: true,
        qtyOut: true,
        batchNo: true,
        lotNo: true,
        expiryDate: true
      },
      orderBy: { date: "asc" }
    });

    const buckets = new Map<
      string,
      {
        batchNo: string | null;
        lotNo: string | null;
        expiryDate: Date | null;
        firstDate: Date;
        qty: Prisma.Decimal;
      }
    >();

    for (const row of ledgerRows) {
      const key = `${row.batchNo ?? ""}__${row.lotNo ?? ""}__${row.expiryDate ? new Date(row.expiryDate).toISOString() : ""}`;
      const existing = buckets.get(key);
      if (!existing) {
        buckets.set(key, {
          batchNo: row.batchNo ?? null,
          lotNo: row.lotNo ?? null,
          expiryDate: row.expiryDate ?? null,
          firstDate: row.date,
          qty: row.qtyIn.sub(row.qtyOut)
        });
      } else {
        existing.qty = existing.qty.add(row.qtyIn).sub(row.qtyOut);
      }
    }

    const sources = Array.from(buckets.values())
      .filter((b) => b.qty.gt(0))
      .sort((a, b) => {
        if (a.expiryDate && b.expiryDate) return a.expiryDate.getTime() - b.expiryDate.getTime();
        if (a.expiryDate && !b.expiryDate) return -1;
        if (!a.expiryDate && b.expiryDate) return 1;
        return a.firstDate.getTime() - b.firstDate.getTime();
      });

    const allocations: Array<{ batchNo: string | null; lotNo: string | null; expiryDate: Date | null; qty: Prisma.Decimal }> = [];
    let remaining = requiredQty;
    for (const src of sources) {
      if (remaining.lte(0)) break;
      const take = src.qty.gte(remaining) ? remaining : src.qty;
      allocations.push({
        batchNo: src.batchNo,
        lotNo: src.lotNo,
        expiryDate: src.expiryDate,
        qty: take
      });
      remaining = remaining.sub(take);
    }

    if (remaining.gt(0)) {
      throw new BadRequestException("Insufficient batch stock to allocate outgoing quantity");
    }

    return allocations;
  }

  private enforceVoucherRules(voucherType: VoucherType, partyId?: string | null) {
    const requiresParty: VoucherType[] = [
      VoucherType.sales_invoice,
      VoucherType.sales_return,
      VoucherType.purchase,
      VoucherType.purchase_return
    ];
    const forbidsParty: VoucherType[] = [
      VoucherType.journal,
      VoucherType.opening,
      VoucherType.reversal,
      VoucherType.contra
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
      if (line.accountId) accountIds.add(line.accountId);
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
      voucherType === VoucherType.reversal ||
      voucherType === VoucherType.contra
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
        accountId: (() => {
          if (!line.accountId) throw new BadRequestException("Line missing accountId");
          return line.accountId;
        })(),
        partyId: line.partyId,
        itemId: line.itemId,
        description: line.description,
        debit: new Prisma.Decimal(debit),
        credit: new Prisma.Decimal(credit),
        qty: new Prisma.Decimal(Number(line.qty || 0)),
        taxCodeId: line.taxCodeId || null,
        taxAmount: new Prisma.Decimal(line.taxAmount || 0),
        warehouseId: line.warehouseId || null,
        binId: line.binId || null,
        batchNo: line.batchNo?.trim() || null,
        lotNo: line.lotNo?.trim() || null,
        expiryDate: this.parseDateOrNull(line.expiryDate),
        expiryDateBs: line.expiryDateBs?.trim() || null,
        serialNumbers: this.normalizeSerialNumbers(line.serialNumbers)
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
    if (!input.voucherType || (!input.voucherDate && !input.voucherDateBs) || !input.lines) {
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
    const resolved = resolveAdDate(input.voucherDate, input.voucherDateBs);
    this.ensureVoucherDate(company, resolved.date);
    await this.validateReferences(user.companyId, input, input.voucherType);
    const lines = this.normalizeLines(input.lines);

    const voucher = await this.prisma.voucher.create({
      data: {
        companyId: user.companyId,
        voucherType: input.voucherType,
        status: VoucherStatus.draft,
        voucherDate: resolved.date,
        voucherDateBs: resolved.bs || null,
        partyId: input.partyId,
        referenceNo: input.referenceNo,
        vendorInvoiceNo: input.vendorInvoiceNo,
        vendorInvoiceDate: input.vendorInvoiceDate,
        memo: input.memo,
        additionalNote: input.additionalNote,
        createdByUserId: user.sub,
        lines: {
          create: lines.map((l) => ({ ...l, accountId: l.accountId!, companyId: user.companyId }))
        }
      } as any,
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

    const data: any = {};
    if (input.voucherType) data.voucherType = input.voucherType;
    // date fields resolved in transaction below
    if (input.partyId !== undefined) {
      data.party = input.partyId ? { connect: { id: input.partyId } } : { disconnect: true };
    }
    if (input.referenceNo !== undefined) data.referenceNo = input.referenceNo;
    if (input.vendorInvoiceNo !== undefined) data.vendorInvoiceNo = input.vendorInvoiceNo;
    if (input.vendorInvoiceDate !== undefined) data.vendorInvoiceDate = input.vendorInvoiceDate;
    if (input.memo !== undefined) data.memo = input.memo;
    if (input.additionalNote !== undefined) data.additionalNote = input.additionalNote;

    return this.prisma.$transaction(async (tx) => {
      const company = await this.getCompanyOrThrow(user.companyId);
      if (input.voucherDate || input.voucherDateBs) {
        const resolved = resolveAdDate(input.voucherDate, input.voucherDateBs);
        data.voucherDate = resolved.date;
        data.voucherDateBs = resolved.bs || null;
        this.ensureVoucherDate(company, resolved.date);
      }
      if (input.lines || input.partyId) await this.validateReferences(user.companyId, input, nextType);

      if (input.lines) {
        const lines = this.normalizeLines(input.lines);
        await tx.voucherLine.deleteMany({ where: { voucherId: voucher.id } });
        await tx.voucherLine.createMany({
          data: lines.map((l) => ({ ...l, accountId: l.accountId!, voucherId: voucher.id, companyId: user.companyId }))
        });
      }

      const updated = await tx.voucher.update({
        where: { id: voucher.id },
        data: data as any
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
        qty: (l as any).qty,
        taxCodeId: l.taxCodeId || undefined,
        taxAmount: l.taxAmount
      }));
      const taxLines = await this.buildTaxLines(user.companyId, voucher.voucherType, normalized);
      const totals = this.computeTotals(
        [...normalized, ...taxLines].map((l) => ({ debit: l.debit, credit: l.credit }))
      );
      if (!totals.debit.equals(totals.credit)) throw new BadRequestException("Voucher not balanced");

      const company = await tx.company.findUnique({ 
        where: { id: user.companyId },
        include: { fiscalSessions: { where: { id: (await tx.company.findFirst({ where: { id: user.companyId } }))?.activeFiscalSessionId || undefined } } }
      });
      if (!company) throw new BadRequestException("Company not found");
      
      const activeSession = company.fiscalSessions[0];
      if (!activeSession) {
        throw new BadRequestException("No active fiscal session found. Please create and activate a fiscal session first.");
      }
      if (activeSession.isLocked) {
        throw new BadRequestException("The active fiscal session is locked.");
      }

      // Validate date is within session range
      if (voucher.voucherDate < activeSession.startDate || voucher.voucherDate > activeSession.endDate) {
        throw new BadRequestException(`Voucher date (${voucher.voucherDate.toISOString().split("T")[0]}) is outside the active fiscal session range (${activeSession.startDate.toISOString().split("T")[0]} to ${activeSession.endDate.toISOString().split("T")[0]}).`);
      }

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

      // Determine correct sequence and prefix based on voucher type from the ACTIVE SESSION
      let sequence: number;
      let prefix: string;
      let suffix: string;
      const seqUpdate: Record<string, number> = {};

      switch (voucher.voucherType) {
        case VoucherType.sales_invoice:
          sequence = activeSession.nextInvoiceNumber;
          prefix = activeSession.invoicePrefix;
          suffix = activeSession.invoiceSuffix || "";
          seqUpdate.nextInvoiceNumber = sequence + 1;
          break;
        case VoucherType.purchase:
          sequence = activeSession.nextPurchaseNumber;
          prefix = activeSession.purchasePrefix;
          suffix = activeSession.purchaseSuffix || "";
          seqUpdate.nextPurchaseNumber = sequence + 1;
          break;
        case VoucherType.sales_return:
          sequence = activeSession.nextSalesReturnNumber;
          prefix = activeSession.salesReturnPrefix;
          suffix = activeSession.salesReturnSuffix || "";
          seqUpdate.nextSalesReturnNumber = sequence + 1;
          break;
        case VoucherType.purchase_return:
          sequence = activeSession.nextPurchaseReturnNumber;
          prefix = activeSession.purchaseReturnPrefix;
          suffix = activeSession.purchaseReturnSuffix || "";
          seqUpdate.nextPurchaseReturnNumber = sequence + 1;
          break;
        case VoucherType.receipt:
          sequence = activeSession.nextReceiptNumber;
          prefix = activeSession.receiptPrefix;
          suffix = activeSession.receiptSuffix || "";
          seqUpdate.nextReceiptNumber = sequence + 1;
          break;
        case VoucherType.payment:
          sequence = activeSession.nextPaymentNumber;
          prefix = activeSession.paymentPrefix;
          suffix = activeSession.paymentSuffix || "";
          seqUpdate.nextPaymentNumber = sequence + 1;
          break;
        case VoucherType.contra:
          sequence = activeSession.nextContraNumber;
          prefix = activeSession.contraPrefix;
          suffix = activeSession.contraSuffix || "";
          seqUpdate.nextContraNumber = sequence + 1;
          break;
        case VoucherType.journal:
        case VoucherType.opening:
        case VoucherType.reversal:
        default:
          sequence = activeSession.nextJournalNumber;
          prefix = activeSession.journalPrefix;
          suffix = activeSession.journalSuffix || "";
          seqUpdate.nextJournalNumber = sequence + 1;
          break;
      }

      const p = prefix || "";
      const s = suffix || "";
      const formattedPrefix = p ? (p.endsWith("-") ? p : `${p}-`) : "";
      const formattedSuffix = s ? (s.startsWith("-") ? s : `-${s}`) : "";
      const voucherNumber = `${formattedPrefix}${sequence}${formattedSuffix}`;

      const posted = await tx.voucher.update({
        where: { id: voucher.id },
        data: {
          status: VoucherStatus.posted,
          postedAt: new Date(),
          postedByUserId: user.sub,
          voucherNumber,
          fiscalSessionId: activeSession.id
        }
      });

      await tx.fiscalSession.update({
        where: { id: activeSession.id },
        data: seqUpdate
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
            qty: l.qty || new Prisma.Decimal(0),
            taxCodeId: l.taxCodeId,
            taxAmount: l.taxAmount
          }))
        });
      }

      // Create stock ledger entries for item-related lines with batch-aware outgoing allocation (FEFO).
      const itemLines = voucher.lines.filter(l => l.itemId);
      if (itemLines.length > 0) {
        const inventorySettings = await this.getInventorySettings(user.companyId, tx);
        if (!inventorySettings.inventoryTrackingEnabled) {
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
        }

        const itemIds = Array.from(new Set(itemLines.map((line) => (line as any).itemId).filter(Boolean))) as string[];
        const itemMap = new Map(
          (await tx.item.findMany({
            where: { id: { in: itemIds }, companyId: user.companyId },
            select: {
              id: true,
              name: true,
              type: true,
              trackInventory: true,
              isSerialized: true,
              isKit: true,
              tracksBatch: true,
              tracksLot: true,
              tracksExpiry: true
            }
          })).map((item) => [item.id, item])
        );
        const stockEntries: Array<{
          companyId: string;
          itemId: string;
          date: Date;
          dateBs?: string;
          voucherId: string;
          qtyIn: Prisma.Decimal;
          qtyOut: Prisma.Decimal;
          rate: Prisma.Decimal;
          amount: Prisma.Decimal;
          warehouseId?: string | null;
          binId?: string | null;
          batchNo?: string | null;
          lotNo?: string | null;
          expiryDate?: Date | null;
          expiryDateBs?: string | null;
        }> = [];

        for (const line of itemLines) {
          const l = line as any; // Cast to access qty
          const item = itemMap.get(l.itemId!);
          if (!item || (item as any).type === "services" || (item as any).trackInventory === false) continue;

          const isStockIn = voucher.voucherType === VoucherType.purchase || voucher.voucherType === VoucherType.sales_return;
          const isStockOut = voucher.voucherType === VoucherType.sales_invoice || voucher.voucherType === VoucherType.purchase_return;

          // Determine quantity based on voucher type
          let qtyIn = new Prisma.Decimal(0);
          let qtyOut = new Prisma.Decimal(0);
          let amount = new Prisma.Decimal(0);
          let rate = new Prisma.Decimal(0);

          // Use the stored quantity from the line, or default to 1 if 0/null (fallback)
          const quantity = (l.qty && l.qty.equals(0) === false) ? l.qty : new Prisma.Decimal(1);
          const scope = await this.normalizeInventoryLine(tx, user.companyId, inventorySettings, item, {
            warehouseId: l.warehouseId,
            binId: l.binId,
            batchNo: l.batchNo,
            lotNo: l.lotNo,
            expiryDate: l.expiryDate,
            expiryDateBs: l.expiryDateBs,
            serialNumbers: l.serialNumbers
          }, quantity);

          if (isStockIn) {
            // Stock-in vouchers use debit for purchases and credit reversal for sales returns.
            amount = l.debit;
            if (voucher.voucherType === VoucherType.sales_return && amount.equals(0)) amount = l.credit;
            qtyIn = quantity; // Use stored qty
            // Prevent division by zero if quantity is somehow 0
            rate = quantity.equals(0) ? new Prisma.Decimal(0) : amount.div(quantity);
          } else if (isStockOut) {
            // Stock-out vouchers use credit for sales and debit reversal for purchase returns.
            amount = l.credit;
            if (voucher.voucherType === VoucherType.purchase_return && amount.equals(0)) amount = l.debit;
            qtyOut = quantity; // Use stored qty
            rate = quantity.equals(0) ? new Prisma.Decimal(0) : amount.div(quantity);
          }

          if (qtyOut.gt(0)) {
            if (!inventorySettings.allowNegativeStock) {
              const available = await this.getScopedStock(tx, user.companyId, l.itemId!, scope);
              if (available.sub(qtyOut).lt(0)) {
                throw new BadRequestException(`Insufficient stock for ${(item as any).name}`);
              }
            }
            const cost = await this.inventory.consumeInventoryCost(tx, {
              companyId: user.companyId,
              itemId: l.itemId!,
              qty: qtyOut,
              costingMethod: inventorySettings.costingMethod,
              allowNegative: inventorySettings.allowNegativeStock,
              warehouseId: scope.warehouseId,
              binId: scope.binId,
              batchNo: scope.batchNo,
              lotNo: scope.lotNo,
              expiryDate: scope.expiryDate
            });
            rate = cost.unitCost;
            amount = cost.amount;
            stockEntries.push({
              companyId: user.companyId,
              itemId: l.itemId!,
              date: voucher.voucherDate,
              dateBs: voucher.voucherDateBs || undefined,
              voucherId: voucher.id,
              warehouseId: scope.warehouseId,
              binId: scope.binId,
              qtyIn: new Prisma.Decimal(0),
              qtyOut,
              rate,
              amount,
              batchNo: scope.batchNo,
              lotNo: scope.lotNo,
              expiryDate: scope.expiryDate,
              expiryDateBs: scope.expiryDateBs
            });
            if (scope.serialNumbers.length) {
              const serialRows = await this.ensureSerialsAvailable(tx, user.companyId, l.itemId!, scope.serialNumbers, scope);
              await tx.serialNumber.updateMany({
                where: { id: { in: serialRows.map((serial) => serial.id) } },
                data: {
                  status: voucher.voucherType === VoucherType.purchase_return ? "returned" : "sold"
                }
              });
            }
            continue;
          }

          stockEntries.push({
            companyId: user.companyId,
            itemId: l.itemId!,
            date: voucher.voucherDate,
            dateBs: voucher.voucherDateBs || undefined,
            voucherId: voucher.id,
            warehouseId: scope.warehouseId,
            binId: scope.binId,
            qtyIn,
            qtyOut,
            rate,
            amount,
            batchNo: scope.batchNo,
            lotNo: scope.lotNo,
            expiryDate: scope.expiryDate,
            expiryDateBs: scope.expiryDateBs
          });
          if (qtyIn.gt(0) && scope.serialNumbers.length) {
            const existing = await tx.serialNumber.findMany({
              where: {
                companyId: user.companyId,
                itemId: l.itemId!,
                serialNo: { in: scope.serialNumbers }
              },
              select: { id: true, serialNo: true, status: true }
            });
            const duplicateAvailable = existing.find((serial) => serial.status === "available");
            if (duplicateAvailable) {
              throw new BadRequestException(`Serial number already available: ${duplicateAvailable.serialNo}`);
            }
            if (existing.length) {
              await tx.serialNumber.updateMany({
                where: { id: { in: existing.map((serial) => serial.id) } },
                data: {
                  status: "available",
                  warehouseId: scope.warehouseId,
                  binId: scope.binId
                }
              });
            }
            const existingSet = new Set(existing.map((serial) => serial.serialNo.toLowerCase()));
            const toCreate = scope.serialNumbers.filter((serial) => !existingSet.has(serial.toLowerCase()));
            if (toCreate.length) {
              await tx.serialNumber.createMany({
                data: toCreate.map((serialNo) => ({
                  companyId: user.companyId,
                  itemId: l.itemId!,
                  serialNo,
                  warehouseId: scope.warehouseId,
                  binId: scope.binId,
                  status: "available"
                }))
              });
            }
          }
        }

        if (stockEntries.length) {
          for (const entry of stockEntries) {
            const ledger = await tx.stockLedger.create({ data: entry });
            if (entry.qtyIn.gt(0)) {
              await this.inventory.receiveInventoryLayer(tx, {
                companyId: entry.companyId,
                itemId: entry.itemId,
                qty: entry.qtyIn,
                unitCost: entry.rate,
                date: entry.date,
                sourceLedgerId: ledger.id,
                sourceVoucherId: entry.voucherId,
                sourceType: String(voucher.voucherType),
                warehouseId: entry.warehouseId ?? null,
                binId: entry.binId ?? null,
                batchNo: entry.batchNo ?? null,
                lotNo: entry.lotNo ?? null,
                expiryDate: entry.expiryDate ?? null,
                expiryDateBs: entry.expiryDateBs ?? null
              });
            }
          }
        }
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
      
      const company = await tx.company.findUnique({ where: { id: user.companyId } });
      if (!company) throw new BadRequestException("Company not found");
      this.ensureVoucherDate(company, voucher.voucherDate);

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
      include: {
        lines: true,
        party: {
          select: { id: true, name: true }
        }
      }
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
        { additionalNote: { contains: filters.q, mode: "insensitive" } },
        { party: { name: { contains: filters.q, mode: "insensitive" } } }
      ];
    }

    const [total, data] = await this.prisma.$transaction([
      this.prisma.voucher.count({ where }),
      this.prisma.voucher.findMany({
        where,
        orderBy: [{ voucherDate: "desc" }, { createdAt: "desc" }],
        skip: filters.skip || 0,
        take: filters.take || 50,
        include: {
          party: { select: { id: true, name: true, panNumber: true, vatNumber: true } },
          lines: {
            include: {
              item: { select: { id: true, name: true, sku: true } },
              account: { select: { id: true, name: true, code: true } },
              party: { select: { id: true, name: true } }
            }
          },
          stockLedger: {
            select: {
              id: true,
              itemId: true,
              qtyIn: true,
              qtyOut: true,
              rate: true
            }
          }
        }
      })
    ]);

    return {
      data,
      meta: {
        total,
        page: Math.floor((filters.skip || 0) / (filters.take || 50)) + 1,
        lastPage: Math.ceil(total / (filters.take || 50))
      }
    };
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
