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
exports.InvoicesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const nepali_date_1 = require("../../common/date/nepali-date");
const inventory_service_1 = require("../inventory/inventory.service");
let InvoicesService = class InvoicesService {
    prisma;
    inventory;
    constructor(prisma, inventory) {
        this.prisma = prisma;
        this.inventory = inventory;
    }
    async getCompany(companyId) {
        const company = await this.prisma.company.findUnique({ where: { id: companyId } });
        if (!company)
            throw new common_1.BadRequestException("Company not found");
        return company;
    }
    async getInventorySettings(companyId, tx) {
        const db = (tx ?? this.prisma);
        const existing = await db.inventorySettings.findUnique({ where: { companyId } });
        if (existing)
            return existing;
        return db.inventorySettings.create({ data: { companyId } });
    }
    normalizeSerialNumbers(serialNumbers) {
        const normalized = (serialNumbers ?? []).map((serial) => serial.trim()).filter(Boolean);
        if (new Set(normalized.map((serial) => serial.toLowerCase())).size !== normalized.length) {
            throw new common_1.BadRequestException("Duplicate serial numbers are not allowed on a line");
        }
        return normalized;
    }
    assertSerializedLine(item, qty, serialNumbers) {
        const serials = this.normalizeSerialNumbers(serialNumbers);
        if (!item.isSerialized) {
            if (serials.length)
                throw new common_1.BadRequestException("Serial numbers are only allowed for serialized items");
            return serials;
        }
        const expected = Number(qty.abs().toString());
        if (!Number.isInteger(expected))
            throw new common_1.BadRequestException("Serialized item quantity must be a whole number");
        if (serials.length !== expected) {
            throw new common_1.BadRequestException(`Serialized item requires ${expected} serial number(s)`);
        }
        return serials;
    }
    async normalizeInventoryLine(db, companyId, settings, item, line, qty) {
        const warehouseId = line.warehouseId || settings.defaultWarehouseId || null;
        const binId = line.binId || null;
        const batchNo = line.batchNo?.trim() || null;
        const lotNo = line.lotNo?.trim() || null;
        const expiryDate = line.expiryDate ?? null;
        const expiryDateBs = line.expiryDateBs?.trim() || null;
        if (item.isSerialized && !settings.serialTrackingEnabled) {
            throw new common_1.BadRequestException("Enable serial tracking in inventory configuration before posting serialized items");
        }
        if (item.isKit && !settings.kitsEnabled) {
            throw new common_1.BadRequestException("Enable kits in inventory configuration before posting kit invoices");
        }
        if ((batchNo || item.tracksBatch) && !settings.batchTrackingEnabled) {
            throw new common_1.BadRequestException("Batch tracking is disabled in inventory configuration");
        }
        if ((lotNo || item.tracksLot) && !settings.lotTrackingEnabled) {
            throw new common_1.BadRequestException("Lot tracking is disabled in inventory configuration");
        }
        if ((expiryDate || expiryDateBs || item.tracksExpiry) && !settings.expiryTrackingEnabled) {
            throw new common_1.BadRequestException("Expiry tracking is disabled in inventory configuration");
        }
        if (warehouseId && !settings.warehousesEnabled) {
            throw new common_1.BadRequestException("Warehouse tracking is disabled in inventory configuration");
        }
        if (binId && !settings.binsEnabled) {
            throw new common_1.BadRequestException("Bin tracking is disabled in inventory configuration");
        }
        if (settings.requireWarehouseOnMovements && !warehouseId) {
            throw new common_1.BadRequestException("Warehouse is required for stock movements");
        }
        if (item.tracksBatch && !batchNo)
            throw new common_1.BadRequestException("Batch number is required for this item");
        if (item.tracksLot && !lotNo)
            throw new common_1.BadRequestException("Lot number is required for this item");
        if (item.tracksExpiry && !expiryDate && !expiryDateBs) {
            throw new common_1.BadRequestException("Expiry date is required for this item");
        }
        if (warehouseId) {
            const warehouse = await db.warehouse.findFirst({
                where: { id: warehouseId, companyId, isActive: true }
            });
            if (!warehouse)
                throw new common_1.BadRequestException("Warehouse not found");
        }
        if (binId) {
            const bin = await db.warehouseBin.findFirst({
                where: { id: binId, companyId, warehouseId, isActive: true }
            });
            if (!bin)
                throw new common_1.BadRequestException("Bin not found for selected warehouse");
        }
        const serialNumbers = this.assertSerializedLine(item, qty, line.serialNumbers);
        return { warehouseId, binId, batchNo, lotNo, expiryDate, expiryDateBs, serialNumbers };
    }
    async getScopedStock(db, companyId, itemId, scope) {
        const balance = await db.stockLedger.aggregate({
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
        return new client_1.Prisma.Decimal(balance._sum.qtyIn ?? 0).sub(new client_1.Prisma.Decimal(balance._sum.qtyOut ?? 0));
    }
    async ensureSerialsAvailable(tx, companyId, itemId, serialNumbers, scope) {
        if (!serialNumbers.length)
            return [];
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
            throw new common_1.BadRequestException("One or more serial numbers are not available at the selected location");
        }
        return serialRows;
    }
    async validateItems(companyId, items) {
        const itemIds = Array.from(new Set(items.map((i) => i.itemId).filter(Boolean)));
        const taxCodeIds = Array.from(new Set(items.flatMap((i) => [
            ...(i.taxCodeId ? [i.taxCodeId] : []),
            ...(Array.isArray(i.taxCodeIds) ? i.taxCodeIds : [])
        ])));
        if (itemIds.length) {
            const dbItems = await this.prisma.item.findMany({ where: { id: { in: itemIds }, companyId } });
            if (dbItems.length !== itemIds.length)
                throw new common_1.BadRequestException("Invalid item");
        }
        if (taxCodeIds.length) {
            const dbTax = await this.prisma.taxCode.findMany({ where: { id: { in: taxCodeIds }, companyId } });
            if (dbTax.length !== taxCodeIds.length)
                throw new common_1.BadRequestException("Invalid tax code");
        }
    }
    computeTotals(items) {
        let subtotal = new client_1.Prisma.Decimal(0);
        let vatAmount = new client_1.Prisma.Decimal(0);
        for (const item of items) {
            const lineAmount = new client_1.Prisma.Decimal(item.qty).mul(item.rate);
            subtotal = subtotal.add(lineAmount);
            if (item.taxAmount)
                vatAmount = vatAmount.add(item.taxAmount);
        }
        const total = subtotal.add(vatAmount);
        return { subtotal, vatAmount, total };
    }
    async enforceStockForSales(user, items) {
        const settings = await this.getInventorySettings(user.companyId);
        if (!settings.inventoryTrackingEnabled || settings.allowNegativeStock)
            return;
        const itemIds = Array.from(new Set(items.map((i) => i.itemId).filter(Boolean)));
        if (!itemIds.length)
            return;
        const dbItems = await this.prisma.item.findMany({
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
        });
        const requiredByScope = new Map();
        for (const line of items) {
            if (!line.itemId)
                continue;
            const item = dbItems.find((i) => i.id === line.itemId);
            if (!item || item.type === "services" || item.trackInventory === false)
                continue;
            const required = new client_1.Prisma.Decimal(line.qty);
            const scope = await this.normalizeInventoryLine(this.prisma, user.companyId, settings, item, line, required);
            const key = [
                line.itemId,
                scope.warehouseId ?? "",
                scope.binId ?? "",
                scope.batchNo ?? "",
                scope.lotNo ?? "",
                scope.expiryDate?.toISOString() ?? ""
            ].join("__");
            const existing = requiredByScope.get(key);
            if (existing)
                existing.qty = existing.qty.add(required);
            else
                requiredByScope.set(key, { item, scope, qty: required });
        }
        for (const { item, scope, qty } of requiredByScope.values()) {
            const available = await this.getScopedStock(this.prisma, user.companyId, item.id, scope);
            if (available.sub(qty).lt(0)) {
                throw new common_1.BadRequestException(`Insufficient stock for ${item.name}`);
            }
        }
    }
    async preview(user, input) {
        await this.validateItems(user.companyId, input.items);
        if (input.type === "sales") {
            await this.enforceStockForSales(user, input.items);
        }
        const party = await this.prisma.party.findFirst({
            where: { id: input.partyId, companyId: user.companyId }
        });
        if (!party)
            throw new common_1.BadRequestException("Party not found");
        const resolvedDate = (0, nepali_date_1.resolveAdDate)(input.date, input.dateBs);
        const resolvedDue = input.dueDate || input.dueDateBs ? (0, nepali_date_1.resolveAdDate)(input.dueDate, input.dueDateBs) : null;
        const itemIds = Array.from(new Set(input.items.map((i) => i.itemId).filter(Boolean)));
        const itemDefaults = itemIds.length
            ? await this.prisma.item.findMany({
                where: { id: { in: itemIds }, companyId: user.companyId },
                select: { id: true, taxCodeId: true }
            })
            : [];
        const explicitTaxIds = Array.from(new Set(input.items.flatMap((i) => [
            ...(i.taxCodeId ? [i.taxCodeId] : []),
            ...(Array.isArray(i.taxCodeIds) ? i.taxCodeIds : [])
        ]).concat(itemDefaults.map((i) => i.taxCodeId).filter(Boolean))));
        const [explicitTaxCodes, itemTaxLinks] = await Promise.all([
            explicitTaxIds.length
                ? this.prisma.taxCode.findMany({ where: { id: { in: explicitTaxIds }, companyId: user.companyId } })
                : Promise.resolve([]),
            itemIds.length
                ? this.prisma.itemTaxCode.findMany({
                    where: { itemId: { in: itemIds } },
                    include: { taxCode: true }
                })
                : Promise.resolve([])
        ]);
        const explicitTaxMap = new Map(explicitTaxCodes.map((t) => [t.id, t]));
        const itemTaxMap = new Map();
        for (const link of itemTaxLinks) {
            const list = itemTaxMap.get(link.itemId) || [];
            list.push(link.taxCode);
            itemTaxMap.set(link.itemId, list);
        }
        for (const item of itemDefaults) {
            if (!item.taxCodeId)
                continue;
            if (itemTaxMap.has(item.id))
                continue;
            const tax = explicitTaxMap.get(item.taxCodeId);
            if (tax)
                itemTaxMap.set(item.id, [tax]);
        }
        const itemsWithTax = input.items.map((item) => {
            const amount = new client_1.Prisma.Decimal(item.qty).mul(item.rate);
            const chosenTaxCodes = Array.isArray(item.taxCodeIds) && item.taxCodeIds.length
                ? item.taxCodeIds.map((id) => explicitTaxMap.get(id)).filter(Boolean)
                : item.taxCodeId
                    ? [explicitTaxMap.get(item.taxCodeId)].filter(Boolean)
                    : item.itemId
                        ? (itemTaxMap.get(item.itemId) ?? [])
                        : [];
            const taxBreakdown = chosenTaxCodes.map((tax) => ({
                taxCodeId: tax.id,
                taxAmount: amount.mul(tax.rate).div(100)
            }));
            const taxAmount = taxBreakdown.reduce((sum, t) => sum.add(t.taxAmount), new client_1.Prisma.Decimal(0));
            const singleTaxId = taxBreakdown.length === 1 ? taxBreakdown[0].taxCodeId : undefined;
            return {
                ...item,
                amount,
                taxAmount,
                taxCodeId: singleTaxId,
                taxBreakdown
            };
        });
        const totals = this.computeTotals(itemsWithTax);
        let sundryNet = new client_1.Prisma.Decimal(0);
        const billSundryIds = (input.sundries || []).map(s => s.billSundryId).filter(Boolean);
        const dbBillSundries = billSundryIds.length
            ? await this.prisma.billSundry.findMany({ where: { id: { in: billSundryIds } } })
            : [];
        const processedSundries = (input.sundries || []).map(s => {
            const amount = new client_1.Prisma.Decimal(s.amount);
            if (s.type === "add")
                sundryNet = sundryNet.add(amount);
            else
                sundryNet = sundryNet.sub(amount);
            const dbSundry = s.billSundryId ? dbBillSundries.find((b) => b.id === s.billSundryId) : null;
            return {
                ...s,
                amount,
                accountId: dbSundry?.accountId || undefined
            };
        });
        totals.total = totals.total.add(sundryNet);
        const voucherLines = [];
        const receivable = await this.prisma.chartOfAccount.findFirst({
            where: { id: input.receivableAccountId, companyId: user.companyId }
        });
        if (!receivable)
            throw new common_1.BadRequestException("Receivable account not found");
        if (receivable.type !== "asset") {
            throw new common_1.BadRequestException("Receivable account must be an asset");
        }
        const itemMap = new Map();
        if (itemsWithTax.some((i) => i.itemId)) {
            const itemIds = itemsWithTax.map((i) => i.itemId).filter(Boolean);
            const [dbItems, fallbackIncome] = await Promise.all([
                this.prisma.item.findMany({ where: { id: { in: itemIds }, companyId: user.companyId } }),
                this.prisma.chartOfAccount.findFirst({
                    where: { companyId: user.companyId, type: "income", code: "4000" }
                })
            ]);
            const incomeFallback = fallbackIncome ??
                (await this.prisma.chartOfAccount.findFirst({
                    where: { companyId: user.companyId, type: "income" }
                }));
            for (const dbItem of dbItems) {
                const incomeId = dbItem.incomeAccountId || incomeFallback?.id;
                if (!incomeId) {
                    throw new common_1.BadRequestException("Item missing income account");
                }
                itemMap.set(dbItem.id, incomeId);
            }
        }
        for (const item of itemsWithTax) {
            const accountId = item.itemId ? itemMap.get(item.itemId) : undefined;
            if (accountId) {
                if (input.type === "sales") {
                    voucherLines.push({
                        accountId,
                        debit: new client_1.Prisma.Decimal(0),
                        credit: item.amount,
                        description: item.description,
                        taxCodeId: item.taxCodeId,
                        taxAmount: item.taxAmount
                    });
                }
                else {
                    voucherLines.push({
                        accountId,
                        debit: item.amount,
                        credit: new client_1.Prisma.Decimal(0),
                        description: item.description,
                        taxCodeId: item.taxCodeId,
                        taxAmount: item.taxAmount
                    });
                }
            }
        }
        const taxGroups = new Map();
        for (const item of itemsWithTax) {
            const breakdown = item.taxBreakdown ?? [];
            for (const t of breakdown) {
                if (t.taxAmount.lte(0))
                    continue;
                taxGroups.set(t.taxCodeId, (taxGroups.get(t.taxCodeId) || new client_1.Prisma.Decimal(0)).add(t.taxAmount));
            }
        }
        if (taxGroups.size) {
            const taxCodes = await this.prisma.taxCode.findMany({
                where: { id: { in: Array.from(taxGroups.keys()) }, companyId: user.companyId }
            });
            for (const taxCode of taxCodes) {
                if (!taxCode.outputTaxAccountId)
                    throw new common_1.BadRequestException("Tax code missing output account");
                const amount = taxGroups.get(taxCode.id) || new client_1.Prisma.Decimal(0);
                if (input.type === "sales") {
                    voucherLines.push({
                        accountId: taxCode.outputTaxAccountId,
                        debit: new client_1.Prisma.Decimal(0),
                        credit: amount,
                        description: "Output VAT",
                        taxCodeId: taxCode.id,
                        taxAmount: amount
                    });
                }
                else {
                    voucherLines.push({
                        accountId: taxCode.outputTaxAccountId,
                        debit: amount,
                        credit: new client_1.Prisma.Decimal(0),
                        description: "Output VAT",
                        taxCodeId: taxCode.id,
                        taxAmount: amount
                    });
                }
            }
        }
        for (const s of processedSundries) {
            if (s.amount.lte(0))
                continue;
            const accountId = s.accountId;
            if (!accountId)
                continue;
            const isAdd = s.type === "add";
            const isSales = input.type === "sales";
            if (isSales) {
                voucherLines.push({
                    accountId,
                    debit: isAdd ? new client_1.Prisma.Decimal(0) : s.amount,
                    credit: isAdd ? s.amount : new client_1.Prisma.Decimal(0),
                    description: s.name
                });
            }
            else {
                voucherLines.push({
                    accountId,
                    debit: isAdd ? s.amount : new client_1.Prisma.Decimal(0),
                    credit: isAdd ? new client_1.Prisma.Decimal(0) : s.amount,
                    description: s.name
                });
            }
        }
        if (input.type === "sales") {
            voucherLines.push({
                accountId: receivable.id,
                partyId: input.partyId,
                debit: totals.total,
                credit: new client_1.Prisma.Decimal(0),
                description: "Accounts Receivable"
            });
        }
        else {
            voucherLines.push({
                accountId: receivable.id,
                partyId: input.partyId,
                debit: new client_1.Prisma.Decimal(0),
                credit: totals.total,
                description: "Accounts Receivable"
            });
        }
        return {
            totals,
            voucherType: input.type === "sales" ? client_1.VoucherType.sales_invoice : client_1.VoucherType.sales_return,
            voucherLines,
            receivableAccountId: receivable.id,
            items: itemsWithTax,
            sundries: processedSundries,
            date: resolvedDate.date,
            dateBs: resolvedDate.bs || input.dateBs,
            dueDate: resolvedDue?.date,
            dueDateBs: resolvedDue?.bs || input.dueDateBs,
            referenceNo: input.referenceNo,
            memo: input.memo,
            additionalNote: input.additionalNote,
            paymentMethodId: input.paymentMethodId,
            saleTypeId: input.saleTypeId
        };
    }
    async createDraft(user, input) {
        try {
            const preview = await this.preview(user, input);
            const totals = preview.totals;
            return await this.prisma.invoice.create({
                data: {
                    companyId: user.companyId,
                    type: input.type,
                    partyId: input.partyId,
                    date: preview.date,
                    dateBs: preview.dateBs || null,
                    dueDate: preview.dueDate,
                    dueDateBs: preview.dueDateBs || null,
                    referenceNo: preview.referenceNo,
                    receivableAccountId: input.receivableAccountId,
                    subtotal: totals.subtotal,
                    vatAmount: totals.vatAmount,
                    total: totals.total,
                    status: "draft",
                    memo: input.memo,
                    additionalNote: input.additionalNote,
                    paymentMethodId: input.paymentMethodId,
                    saleTypeId: input.saleTypeId,
                    items: {
                        create: preview.items.map((item) => ({
                            itemId: item.itemId,
                            description: item.description,
                            qty: new client_1.Prisma.Decimal(item.qty),
                            rate: new client_1.Prisma.Decimal(item.rate),
                            amount: item.amount,
                            taxCodeId: item.taxCodeId,
                            taxAmount: item.taxAmount,
                            warehouseId: item.warehouseId || null,
                            binId: item.binId || null,
                            batchNo: item.batchNo || null,
                            lotNo: item.lotNo || null,
                            expiryDate: item.expiryDate || null,
                            expiryDateBs: item.expiryDateBs || null,
                            serialNumbers: this.normalizeSerialNumbers(item.serialNumbers),
                            taxes: item.taxBreakdown?.length
                                ? {
                                    create: item.taxBreakdown.map((t) => ({
                                        taxCodeId: t.taxCodeId,
                                        taxAmount: t.taxAmount
                                    }))
                                }
                                : undefined
                        }))
                    },
                    sundries: {
                        create: preview.sundries.map((s) => ({
                            billSundryId: s.billSundryId,
                            name: s.name,
                            type: s.type,
                            rate: s.rate ? new client_1.Prisma.Decimal(s.rate) : null,
                            amount: s.amount,
                            accountId: s.accountId
                        }))
                    }
                },
                include: { items: true, sundries: true }
            });
        }
        catch (e) {
            throw new common_1.BadRequestException(e.message ?? "Failed to save draft");
        }
    }
    async post(user, invoiceId) {
        const invoice = await this.prisma.invoice.findFirst({
            where: { id: invoiceId, companyId: user.companyId },
            include: { items: true, sundries: true }
        });
        if (!invoice)
            throw new common_1.NotFoundException("Invoice not found");
        if (invoice.status !== "draft")
            throw new common_1.ForbiddenException("Only draft invoices can be posted");
        const company = await this.getCompany(user.companyId);
        if (company.lockDate && invoice.date <= company.lockDate) {
            throw new common_1.BadRequestException("Invoice date is locked");
        }
        const preview = await this.preview(user, {
            type: invoice.type,
            partyId: invoice.partyId,
            date: invoice.date,
            dueDate: invoice.dueDate || undefined,
            referenceNo: invoice.referenceNo || undefined,
            receivableAccountId: invoice.receivableAccountId,
            items: invoice.items.map((i) => ({
                itemId: i.itemId || undefined,
                description: i.description || undefined,
                qty: i.qty.toNumber ? i.qty.toNumber() : Number(i.qty),
                rate: i.rate.toNumber ? i.rate.toNumber() : Number(i.rate),
                taxCodeId: i.taxCodeId || undefined,
                warehouseId: i.warehouseId || undefined,
                binId: i.binId || undefined,
                batchNo: i.batchNo || undefined,
                lotNo: i.lotNo || undefined,
                expiryDate: i.expiryDate || undefined,
                expiryDateBs: i.expiryDateBs || undefined,
                serialNumbers: i.serialNumbers || undefined
            })),
            sundries: invoice.sundries.map((s) => ({
                billSundryId: s.billSundryId || undefined,
                name: s.name,
                type: s.type,
                rate: s.rate?.toNumber ? s.rate.toNumber() : (s.rate ? Number(s.rate) : null),
                amount: s.amount.toNumber ? s.amount.toNumber() : Number(s.amount)
            })),
            memo: invoice.memo || undefined,
            additionalNote: invoice.additionalNote || undefined
        });
        if (invoice.type === "sales") {
            await this.enforceStockForSales(user, invoice.items.map((i) => ({
                itemId: i.itemId || undefined,
                qty: i.qty.toNumber ? i.qty.toNumber() : Number(i.qty),
                rate: i.rate.toNumber ? i.rate.toNumber() : Number(i.rate),
                warehouseId: i.warehouseId || undefined,
                binId: i.binId || undefined,
                batchNo: i.batchNo || undefined,
                lotNo: i.lotNo || undefined,
                expiryDate: i.expiryDate || undefined,
                expiryDateBs: i.expiryDateBs || undefined,
                serialNumbers: i.serialNumbers || undefined
            })));
        }
        const voucherType = invoice.type === "sales" ? client_1.VoucherType.sales_invoice : client_1.VoucherType.sales_return;
        const sequence = company.nextInvoiceNumber;
        const voucherNumber = `${company.invoicePrefix}-${sequence}`;
        return this.prisma.$transaction(async (tx) => {
            const voucher = await tx.voucher.create({
                data: {
                    companyId: user.companyId,
                    voucherType,
                    status: client_1.VoucherStatus.posted,
                    voucherDate: invoice.date,
                    partyId: invoice.partyId,
                    referenceNo: invoice.referenceNo,
                    memo: preview.memo || `Invoice ${invoice.id}`,
                    additionalNote: preview.additionalNote,
                    postedAt: new Date(),
                    postedByUserId: user.sub,
                    voucherNumber,
                    lines: {
                        create: preview.voucherLines.map((l, idx) => ({
                            companyId: user.companyId,
                            lineNo: idx + 1,
                            accountId: l.accountId,
                            partyId: l.partyId,
                            description: l.description,
                            debit: l.debit,
                            credit: l.credit,
                            taxCodeId: l.taxCodeId,
                            taxAmount: l.taxAmount || new client_1.Prisma.Decimal(0)
                        }))
                    }
                }
            });
            await tx.company.update({
                where: { id: company.id },
                data: { nextInvoiceNumber: sequence + 1 }
            });
            const inventorySettings = await this.getInventorySettings(user.companyId, tx);
            const stockLedgerData = [];
            for (const item of invoice.items) {
                if (!inventorySettings.inventoryTrackingEnabled)
                    continue;
                if (!item.itemId)
                    continue;
                const isOut = invoice.type === "sales";
                const isIn = invoice.type === "sales_return";
                const qty = item.qty.toNumber ? item.qty.toNumber() : Number(item.qty);
                const rate = item.rate.toNumber ? item.rate.toNumber() : Number(item.rate);
                const qtyDecimal = new client_1.Prisma.Decimal(qty);
                const itemRecord = await tx.item.findUnique({
                    where: { id: item.itemId },
                    include: {
                        components: {
                            include: {
                                component: {
                                    select: {
                                        id: true,
                                        name: true,
                                        type: true,
                                        trackInventory: true,
                                        isSerialized: true,
                                        tracksBatch: true,
                                        tracksLot: true,
                                        tracksExpiry: true
                                    }
                                }
                            }
                        }
                    }
                });
                if (!itemRecord || itemRecord.type === "services" || itemRecord.trackInventory === false)
                    continue;
                const scope = await this.normalizeInventoryLine(tx, user.companyId, inventorySettings, itemRecord, {
                    itemId: item.itemId,
                    qty,
                    rate,
                    warehouseId: item.warehouseId,
                    binId: item.binId,
                    batchNo: item.batchNo,
                    lotNo: item.lotNo,
                    expiryDate: item.expiryDate,
                    expiryDateBs: item.expiryDateBs,
                    serialNumbers: item.serialNumbers
                }, qtyDecimal);
                if (isOut && !inventorySettings.allowNegativeStock) {
                    const available = await this.getScopedStock(tx, user.companyId, item.itemId, scope);
                    if (available.sub(qtyDecimal).lt(0)) {
                        throw new common_1.BadRequestException(`Insufficient stock for ${itemRecord.name}`);
                    }
                }
                const computeMAC = async (targetItemId) => {
                    const allEntries = await tx.stockLedger.findMany({
                        where: { companyId: user.companyId, itemId: targetItemId },
                        select: { qtyIn: true, qtyOut: true, amount: true }
                    });
                    let totalQty = 0;
                    let totalValue = 0;
                    for (const entry of allEntries) {
                        const qIn = Number(entry.qtyIn || 0);
                        const qOut = Number(entry.qtyOut || 0);
                        const amt = Number(entry.amount || 0);
                        if (qIn > 0) {
                            totalQty += qIn;
                            totalValue += amt;
                        }
                        if (qOut > 0) {
                            totalQty -= qOut;
                            totalValue -= amt;
                        }
                    }
                    return {
                        stock: totalQty,
                        avgCost: totalQty > 0 ? (totalValue / totalQty) : 0
                    };
                };
                if (itemRecord?.isKit && itemRecord.components.length > 0 && isOut) {
                    const kitMac = await computeMAC(item.itemId);
                    const currentKitStock = kitMac.stock;
                    let qtyToDeductKit = 0;
                    let qtyToExplode = qty;
                    if (currentKitStock > 0) {
                        qtyToDeductKit = Math.min(currentKitStock, qty);
                        qtyToExplode = qty - qtyToDeductKit;
                    }
                    if (qtyToDeductKit > 0) {
                        const kitCost = await this.inventory.consumeInventoryCost(tx, {
                            companyId: user.companyId,
                            itemId: item.itemId,
                            qty: new client_1.Prisma.Decimal(qtyToDeductKit),
                            costingMethod: inventorySettings.costingMethod,
                            allowNegative: inventorySettings.allowNegativeStock,
                            warehouseId: scope.warehouseId,
                            binId: scope.binId,
                            batchNo: scope.batchNo,
                            lotNo: scope.lotNo,
                            expiryDate: scope.expiryDate
                        });
                        stockLedgerData.push({
                            companyId: user.companyId,
                            itemId: item.itemId,
                            date: invoice.date,
                            voucherId: voucher.id,
                            warehouseId: scope.warehouseId,
                            binId: scope.binId,
                            qtyIn: 0,
                            qtyOut: qtyToDeductKit,
                            rate: kitCost.unitCost,
                            amount: kitCost.amount,
                            batchNo: scope.batchNo,
                            lotNo: scope.lotNo,
                            expiryDate: scope.expiryDate,
                            expiryDateBs: scope.expiryDateBs
                        });
                    }
                    if (qtyToExplode > 0) {
                        for (const comp of itemRecord.components) {
                            if (comp.component?.isSerialized ||
                                comp.component?.tracksBatch ||
                                comp.component?.tracksLot ||
                                comp.component?.tracksExpiry) {
                                throw new common_1.BadRequestException(`Kit component "${comp.component.name}" requires tracking selection. Assemble the kit before selling it.`);
                            }
                            const compQty = Number(comp.qty) * qtyToExplode;
                            const compCost = await this.inventory.consumeInventoryCost(tx, {
                                companyId: user.companyId,
                                itemId: comp.componentId,
                                qty: new client_1.Prisma.Decimal(compQty),
                                costingMethod: inventorySettings.costingMethod,
                                allowNegative: inventorySettings.allowNegativeStock
                            });
                            stockLedgerData.push({
                                companyId: user.companyId,
                                itemId: comp.componentId,
                                date: invoice.date,
                                voucherId: voucher.id,
                                qtyIn: 0,
                                qtyOut: compQty,
                                rate: compCost.unitCost,
                                amount: compCost.amount
                            });
                        }
                    }
                }
                else {
                    let finalRate = rate;
                    let finalAmount = qty * rate;
                    if (isOut) {
                        const cost = await this.inventory.consumeInventoryCost(tx, {
                            companyId: user.companyId,
                            itemId: item.itemId,
                            qty: qtyDecimal,
                            costingMethod: inventorySettings.costingMethod,
                            allowNegative: inventorySettings.allowNegativeStock,
                            warehouseId: scope.warehouseId,
                            binId: scope.binId,
                            batchNo: scope.batchNo,
                            lotNo: scope.lotNo,
                            expiryDate: scope.expiryDate
                        });
                        finalRate = Number(cost.unitCost.toString());
                        finalAmount = Number(cost.amount.toString());
                    }
                    stockLedgerData.push({
                        companyId: user.companyId,
                        itemId: item.itemId,
                        date: invoice.date,
                        voucherId: voucher.id,
                        warehouseId: scope.warehouseId,
                        binId: scope.binId,
                        qtyIn: isIn ? qty : 0,
                        qtyOut: isOut ? qty : 0,
                        rate: finalRate,
                        amount: finalAmount,
                        batchNo: scope.batchNo,
                        lotNo: scope.lotNo,
                        expiryDate: scope.expiryDate,
                        expiryDateBs: scope.expiryDateBs
                    });
                }
                if (scope.serialNumbers.length) {
                    if (isOut) {
                        const serialRows = await this.ensureSerialsAvailable(tx, user.companyId, item.itemId, scope.serialNumbers, scope);
                        await tx.serialNumber.updateMany({
                            where: { id: { in: serialRows.map((serial) => serial.id) } },
                            data: { status: "sold", salesInvoiceId: invoice.id }
                        });
                    }
                    else if (isIn) {
                        const existing = await tx.serialNumber.findMany({
                            where: {
                                companyId: user.companyId,
                                itemId: item.itemId,
                                serialNo: { in: scope.serialNumbers }
                            },
                            select: { id: true, serialNo: true, status: true }
                        });
                        const duplicateAvailable = existing.find((serial) => serial.status === "available");
                        if (duplicateAvailable) {
                            throw new common_1.BadRequestException(`Serial number already available: ${duplicateAvailable.serialNo}`);
                        }
                        if (existing.length) {
                            await tx.serialNumber.updateMany({
                                where: { id: { in: existing.map((serial) => serial.id) } },
                                data: {
                                    status: "available",
                                    warehouseId: scope.warehouseId,
                                    binId: scope.binId,
                                    salesInvoiceId: null
                                }
                            });
                        }
                        const existingSet = new Set(existing.map((serial) => serial.serialNo.toLowerCase()));
                        const toCreate = scope.serialNumbers.filter((serial) => !existingSet.has(serial.toLowerCase()));
                        if (toCreate.length) {
                            await tx.serialNumber.createMany({
                                data: toCreate.map((serialNo) => ({
                                    companyId: user.companyId,
                                    itemId: item.itemId,
                                    serialNo,
                                    warehouseId: scope.warehouseId,
                                    binId: scope.binId,
                                    status: "available"
                                }))
                            });
                        }
                    }
                }
            }
            if (stockLedgerData.length > 0) {
                for (const row of stockLedgerData) {
                    const ledger = await tx.stockLedger.create({ data: row });
                    const qtyIn = new client_1.Prisma.Decimal(String(row.qtyIn ?? 0));
                    if (qtyIn.gt(0)) {
                        const amount = new client_1.Prisma.Decimal(String(row.amount ?? 0));
                        const movementDate = row.date instanceof Date ? row.date : new Date(row.date);
                        const expiryDate = row.expiryDate
                            ? row.expiryDate instanceof Date ? row.expiryDate : new Date(row.expiryDate)
                            : null;
                        await this.inventory.receiveInventoryLayer(tx, {
                            companyId: user.companyId,
                            itemId: row.itemId,
                            qty: qtyIn,
                            unitCost: qtyIn.gt(0) ? amount.div(qtyIn) : new client_1.Prisma.Decimal(0),
                            date: movementDate,
                            sourceLedgerId: ledger.id,
                            sourceVoucherId: voucher.id,
                            sourceType: invoice.type === "sales_return" ? "sales_return" : "invoice",
                            warehouseId: row.warehouseId ?? null,
                            binId: row.binId ?? null,
                            batchNo: row.batchNo ?? null,
                            lotNo: row.lotNo ?? null,
                            expiryDate,
                            expiryDateBs: row.expiryDateBs ?? null
                        });
                    }
                }
            }
            return tx.invoice.update({
                where: { id: invoice.id },
                data: {
                    status: "posted",
                    voucherId: voucher.id,
                    invoiceNo: voucherNumber
                }
            });
        });
    }
    async void(user, invoiceId) {
        const invoice = await this.prisma.invoice.findFirst({
            where: { id: invoiceId, companyId: user.companyId }
        });
        if (!invoice)
            throw new common_1.NotFoundException("Invoice not found");
        if (invoice.status !== "posted" || !invoice.voucherId) {
            throw new common_1.ForbiddenException("Only posted invoices can be voided");
        }
        const voucherId = invoice.voucherId;
        await this.prisma.$transaction(async (tx) => {
            await tx.voucher.update({
                where: { id: voucherId },
                data: { status: client_1.VoucherStatus.void, voidedAt: new Date(), voidedByUserId: user.sub }
            });
            await tx.stockLedger.deleteMany({
                where: { voucherId }
            });
            await tx.invoice.update({
                where: { id: invoice.id },
                data: { status: "void" }
            });
        });
        return { success: true };
    }
    async list(user, filters) {
        const where = { companyId: user.companyId };
        if (filters.type)
            where.type = filters.type;
        if (filters.status)
            where.status = filters.status;
        if (filters.from || filters.to) {
            where.date = {};
            if (filters.from)
                where.date.gte = filters.from;
            if (filters.to)
                where.date.lte = filters.to;
        }
        if (filters.q) {
            where.OR = [
                { invoiceNo: { contains: filters.q, mode: "insensitive" } },
                { referenceNo: { contains: filters.q, mode: "insensitive" } },
                { memo: { contains: filters.q, mode: "insensitive" } },
                { additionalNote: { contains: filters.q, mode: "insensitive" } },
                { party: { name: { contains: filters.q, mode: "insensitive" } } }
            ];
        }
        return this.prisma.invoice.findMany({
            where,
            include: {
                party: {
                    select: { id: true, name: true, panNumber: true, vatNumber: true }
                },
                items: {
                    include: {
                        item: { select: { id: true, name: true } }
                    }
                },
                voucher: {
                    select: { memo: true, referenceNo: true, additionalNote: true, postedAt: true }
                }
            },
            orderBy: { date: "desc" },
            skip: filters.skip || 0,
            take: filters.take || 50
        });
    }
    async getById(user, invoiceId) {
        const invoice = await this.prisma.invoice.findFirst({
            where: { id: invoiceId, companyId: user.companyId },
            include: {
                items: {
                    include: {
                        item: { select: { id: true, name: true, hsCode: true } },
                        taxes: { include: { taxCode: true } }
                    }
                },
                sundries: true
            }
        });
        if (!invoice)
            throw new common_1.NotFoundException("Invoice not found");
        return {
            ...invoice,
            items: invoice.items.map((it) => ({
                ...it,
                itemName: it.item?.name ?? undefined,
                hsCode: it.item?.hsCode ?? undefined,
                taxBreakdown: it.taxes?.map((t) => ({
                    taxCodeId: t.taxCodeId,
                    name: t.taxCode?.name,
                    rate: t.taxCode?.rate,
                    taxAmount: t.taxAmount
                }))
            }))
        };
    }
    async updateDraft(user, id, input) {
        const existing = await this.prisma.invoice.findFirst({
            where: { id, companyId: user.companyId }
        });
        if (!existing)
            throw new common_1.NotFoundException("Invoice not found");
        if (existing.status !== "draft")
            throw new common_1.ForbiddenException("Only draft invoices can be updated");
        const preview = await this.preview(user, input);
        const totals = preview.totals;
        return await this.prisma.$transaction(async (tx) => {
            await tx.invoiceItemTax.deleteMany({ where: { invoiceItem: { invoiceId: id } } });
            await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
            await tx.invoiceSundry.deleteMany({ where: { invoiceId: id } });
            return await tx.invoice.update({
                where: { id },
                data: {
                    type: input.type,
                    partyId: input.partyId,
                    date: preview.date,
                    dateBs: preview.dateBs || null,
                    dueDate: preview.dueDate,
                    dueDateBs: preview.dueDateBs || null,
                    referenceNo: preview.referenceNo,
                    receivableAccountId: input.receivableAccountId,
                    subtotal: totals.subtotal,
                    vatAmount: totals.vatAmount,
                    total: totals.total,
                    memo: input.memo,
                    additionalNote: input.additionalNote,
                    paymentMethodId: input.paymentMethodId,
                    saleTypeId: input.saleTypeId,
                    items: {
                        create: preview.items.map((item) => ({
                            itemId: item.itemId,
                            description: item.description,
                            qty: new client_1.Prisma.Decimal(item.qty),
                            rate: new client_1.Prisma.Decimal(item.rate),
                            amount: item.amount,
                            taxCodeId: item.taxCodeId,
                            taxAmount: item.taxAmount,
                            warehouseId: item.warehouseId || null,
                            binId: item.binId || null,
                            batchNo: item.batchNo || null,
                            lotNo: item.lotNo || null,
                            expiryDate: item.expiryDate || null,
                            expiryDateBs: item.expiryDateBs || null,
                            serialNumbers: this.normalizeSerialNumbers(item.serialNumbers),
                            taxes: item.taxBreakdown?.length
                                ? {
                                    create: item.taxBreakdown.map((t) => ({
                                        taxCodeId: t.taxCodeId,
                                        taxAmount: t.taxAmount
                                    }))
                                }
                                : undefined
                        }))
                    },
                    sundries: {
                        create: preview.sundries.map((s) => ({
                            billSundryId: s.billSundryId,
                            name: s.name,
                            type: s.type,
                            rate: s.rate ? new client_1.Prisma.Decimal(s.rate) : null,
                            amount: s.amount,
                            accountId: s.accountId
                        }))
                    }
                }
            });
        });
    }
};
exports.InvoicesService = InvoicesService;
exports.InvoicesService = InvoicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        inventory_service_1.InventoryService])
], InvoicesService);
//# sourceMappingURL=invoices.service.js.map