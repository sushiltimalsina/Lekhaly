import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, PurchaseOrderStatus } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";
import { resolveAdDate } from "../../common/date/nepali-date";

import { VouchersService } from "../vouchers/vouchers.service";
import { VoucherType } from "@prisma/client";

// Service for handling Purchase Orders
@Injectable()
export class PurchaseOrdersService {
    constructor(
        private prisma: PrismaService,
        private vouchersService: VouchersService
    ) { }

    private async validateItems(
        companyId: string,
        items: Array<{ itemId?: string; taxCodeId?: string }>
    ) {
        const itemIds = Array.from(new Set(items.map((i) => i.itemId).filter(Boolean))) as string[];
        const taxCodeIds = Array.from(new Set(items.map((i) => i.taxCodeId).filter(Boolean))) as string[];

        if (itemIds.length) {
            const dbItems = await this.prisma.item.findMany({ where: { id: { in: itemIds }, companyId } });
            if (dbItems.length !== itemIds.length) throw new BadRequestException("Invalid item");
        }
        if (taxCodeIds.length) {
            const dbTax = await this.prisma.taxCode.findMany({ where: { id: { in: taxCodeIds }, companyId } });
            if (dbTax.length !== taxCodeIds.length) throw new BadRequestException("Invalid tax code");
        }
    }

    private computeTotals(
        items: Array<{ qty: number; rate: number; taxAmount?: Prisma.Decimal }>
    ) {
        let subtotal = new Prisma.Decimal(0);
        let vatAmount = new Prisma.Decimal(0);
        for (const item of items) {
            const lineAmount = new Prisma.Decimal(item.qty).mul(item.rate);
            subtotal = subtotal.add(lineAmount);
            if (item.taxAmount) vatAmount = vatAmount.add(item.taxAmount);
        }
        const total = subtotal.add(vatAmount);
        return { subtotal, vatAmount, total };
    }

    async create(user: AuthUser, input: any) {
        await this.validateItems(user.companyId, input.items);

        const party = await this.prisma.party.findFirst({
            where: { id: input.partyId, companyId: user.companyId }
        });
        if (!party) throw new BadRequestException("Supplier not found");

        const resolvedDate = resolveAdDate(input.orderDate, input.orderDateBs);
        const resolvedDelivery = input.expectedDelivery || input.expectedDeliveryBs
            ? resolveAdDate(input.expectedDelivery, input.expectedDeliveryBs)
            : { date: null, bs: null };

        const taxCodes = await this.prisma.taxCode.findMany({
            where: { companyId: user.companyId }
        });
        const taxMap = new Map(taxCodes.map(t => [t.id, t]));

        const processedItems = input.items.map((item: any) => {
            const amount = new Prisma.Decimal(item.qty).mul(item.rate);
            const tax = item.taxCodeId ? taxMap.get(item.taxCodeId) : null;
            const taxAmount = tax ? amount.mul(tax.rate).div(100) : new Prisma.Decimal(0);
            return {
                ...item,
                amount,
                taxAmount
            };
        });

        const { subtotal, vatAmount, total: baseTotal } = this.computeTotals(processedItems);

        let total = baseTotal;
        const processedSundries = (input.sundries || []).map((s: any) => {
            const amt = new Prisma.Decimal(s.amount);
            if (s.type === "add") total = total.add(amt);
            else total = total.sub(amt);
            return { ...s, amount: amt };
        });

        const company = await this.prisma.company.findUnique({ 
            where: { id: user.companyId },
            include: { fiscalSessions: { where: { id: (await this.prisma.company.findFirst({ where: { id: user.companyId } }))?.activeFiscalSessionId || undefined } } }
        });
        if (!company) throw new BadRequestException("Company not found");
        
        const activeSession = company.fiscalSessions[0];
        if (!activeSession) throw new BadRequestException("No active fiscal session found");

        const sequence = activeSession.nextPurchaseOrderNumber;
        const p = activeSession.purchaseOrderPrefix || "PO";
        const orderNo = `${p}-${sequence}`;

        return await this.prisma.$transaction(async (tx) => {
            await tx.fiscalSession.update({
                where: { id: activeSession.id },
                data: { nextPurchaseOrderNumber: sequence + 1 }
            });

            return await tx.purchaseOrder.create({
                data: {
                    companyId: user.companyId,
                    partyId: input.partyId,
                    orderNo,
                    status: PurchaseOrderStatus.open,
                    date: resolvedDate.date,
                    dateBs: resolvedDate.bs || input.orderDateBs,
                    expectedDelivery: resolvedDelivery.date,
                    expectedDeliveryBs: resolvedDelivery.bs || input.expectedDeliveryBs,
                    subtotal,
                    vatAmount,
                    total,
                    memo: input.memo,
                    additionalNote: input.notes,
                    terms: input.terms,
                    items: {
                        create: processedItems.map((item: any) => ({
                            itemId: item.itemId,
                            description: item.description,
                            qty: new Prisma.Decimal(item.qty),
                            rate: new Prisma.Decimal(item.rate),
                            amount: item.amount,
                            taxCodeId: item.taxCodeId,
                            taxAmount: item.taxAmount
                        }))
                    },
                    sundries: {
                        create: processedSundries.map((s: any) => ({
                            billSundryId: s.billSundryId,
                            name: s.name,
                            type: s.type,
                            rate: s.rate ? new Prisma.Decimal(s.rate) : null,
                            amount: s.amount
                        }))
                    }
                },
                include: { items: true, sundries: true }
            });
        });
    }

    async update(user: AuthUser, id: string, input: any) {
        await this.validateItems(user.companyId, input.items);

        const existing = await this.prisma.purchaseOrder.findFirst({
            where: { id, companyId: user.companyId },
            include: { items: true }
        });
        if (!existing) throw new NotFoundException("Purchase order not found");
        if (existing.status === PurchaseOrderStatus.cancelled) {
            throw new BadRequestException("Cancelled purchase orders cannot be edited");
        }
        if (existing.status === PurchaseOrderStatus.received || existing.items.some((line) => line.receivedQty.gt(0))) {
            throw new BadRequestException("Purchase orders with received goods cannot be edited");
        }

        const party = await this.prisma.party.findFirst({
            where: { id: input.partyId, companyId: user.companyId }
        });
        if (!party) throw new BadRequestException("Supplier not found");

        const resolvedDate = resolveAdDate(input.orderDate, input.orderDateBs);
        const resolvedDelivery = input.expectedDelivery || input.expectedDeliveryBs
            ? resolveAdDate(input.expectedDelivery, input.expectedDeliveryBs)
            : { date: null, bs: null };

        const taxCodes = await this.prisma.taxCode.findMany({
            where: { companyId: user.companyId }
        });
        const taxMap = new Map(taxCodes.map(t => [t.id, t]));

        const processedItems = input.items.map((item: any) => {
            const amount = new Prisma.Decimal(item.qty).mul(item.rate);
            const tax = item.taxCodeId ? taxMap.get(item.taxCodeId) : null;
            const taxAmount = tax ? amount.mul(tax.rate).div(100) : new Prisma.Decimal(0);
            return { ...item, amount, taxAmount };
        });

        const { subtotal, vatAmount, total: baseTotal } = this.computeTotals(processedItems);
        let total = baseTotal;
        const processedSundries = (input.sundries || []).map((s: any) => {
            const amt = new Prisma.Decimal(s.amount);
            if (s.type === "add") total = total.add(amt);
            else total = total.sub(amt);
            return { ...s, amount: amt };
        });

        return this.prisma.$transaction(async (tx) => {
            await tx.purchaseOrderSundry.deleteMany({ where: { orderId: id } });
            await tx.purchaseOrderItem.deleteMany({ where: { orderId: id } });
            return tx.purchaseOrder.update({
                where: { id },
                data: {
                    partyId: input.partyId,
                    status: PurchaseOrderStatus.open,
                    date: resolvedDate.date,
                    dateBs: resolvedDate.bs || input.orderDateBs,
                    expectedDelivery: resolvedDelivery.date,
                    expectedDeliveryBs: resolvedDelivery.bs || input.expectedDeliveryBs,
                    subtotal,
                    vatAmount,
                    total,
                    memo: input.memo,
                    additionalNote: input.notes,
                    terms: input.terms,
                    items: {
                        create: processedItems.map((item: any) => ({
                            itemId: item.itemId,
                            description: item.description,
                            qty: new Prisma.Decimal(item.qty),
                            rate: new Prisma.Decimal(item.rate),
                            amount: item.amount,
                            taxCodeId: item.taxCodeId,
                            taxAmount: item.taxAmount
                        }))
                    },
                    sundries: {
                        create: processedSundries.map((s: any) => ({
                            billSundryId: s.billSundryId,
                            name: s.name,
                            type: s.type,
                            rate: s.rate ? new Prisma.Decimal(s.rate) : null,
                            amount: s.amount
                        }))
                    }
                },
                include: { items: true, sundries: true, party: { select: { id: true, name: true } } }
            });
        });
    }

    async list(user: AuthUser, filters: any) {
        const where: Prisma.PurchaseOrderWhereInput = { companyId: user.companyId };
        if (filters.status) where.status = filters.status;
        if (filters.from || filters.to) {
            where.date = {};
            if (filters.from) (where.date as Prisma.DateTimeFilter).gte = filters.from;
            if (filters.to) (where.date as Prisma.DateTimeFilter).lte = filters.to;
        }

        if (filters.q) {
            where.OR = [
                { orderNo: { contains: filters.q, mode: "insensitive" } },
                { memo: { contains: filters.q, mode: "insensitive" } },
                { party: { name: { contains: filters.q, mode: "insensitive" } } }
            ];
        }

        const [total, data] = await this.prisma.$transaction([
            this.prisma.purchaseOrder.count({ where }),
            this.prisma.purchaseOrder.findMany({
                where,
                include: {
                    party: { select: { id: true, name: true } },
                    items: { include: { item: { select: { name: true } } } }
                },
                orderBy: { date: "desc" },
                skip: filters.skip || 0,
                take: filters.take || 50
            })
        ]);

        const normalizedData = data.map((order) => ({
            ...order,
            orderDate: order.date,
            orderDateBs: order.dateBs,
            partyName: order.party?.name ?? null,
            items: order.items.map((line) => ({
                ...line,
                itemName: line.item?.name ?? null
            }))
        }));

        return {
            data: normalizedData,
            meta: {
                total,
                page: Math.floor((filters.skip || 0) / (filters.take || 50)) + 1,
                lastPage: Math.ceil(total / (filters.take || 50))
            }
        };
    }

    async getById(user: AuthUser, id: string) {
        const order = await this.prisma.purchaseOrder.findFirst({
            where: { id, companyId: user.companyId },
            include: {
                items: { include: { item: { select: { name: true, unit: true } } } },
                sundries: true,
                party: true
            }
        });
        if (!order) throw new NotFoundException("Purchase order not found");
        return order;
    }

    async cancel(user: AuthUser, id: string) {
        const order = await this.prisma.purchaseOrder.findFirst({
            where: { id, companyId: user.companyId }
        });
        if (!order) throw new NotFoundException("Purchase order not found");
        return this.prisma.purchaseOrder.update({
            where: { id },
            data: { status: PurchaseOrderStatus.cancelled }
        });
    }

    async convertToPurchase(user: AuthUser, id: string) {
        const order = await this.prisma.purchaseOrder.findFirst({
            where: { id, companyId: user.companyId },
            include: {
                items: { include: { item: true } },
                sundries: true
            }
        });

        if (!order) throw new NotFoundException("Purchase order not found");
        if (order.status === PurchaseOrderStatus.cancelled) throw new BadRequestException("Cancelled orders cannot be converted");

        const payable = await this.prisma.chartOfAccount.findFirst({
            where: { companyId: user.companyId, type: "liability", isPostable: true },
            orderBy: { code: "desc" }
        });

        if (!payable) throw new BadRequestException("No payable account found (liability).");

        const lines: any[] = [];

        for (const item of order.items) {
            const expenseAccountId = item.item?.expenseAccountId;
            if (!expenseAccountId) throw new BadRequestException(`Item ${item.item?.name || item.itemId} missing expense account`);

            lines.push({
                itemId: item.itemId,
                description: item.description || "Purchase",
                qty: item.qty.toNumber(),
                // Draft input expects: debit, credit, etc.
                debit: item.amount.toNumber(),
                credit: 0,
                accountId: expenseAccountId,
                taxCodeId: item.taxCodeId,
                taxAmount: item.taxAmount?.toNumber()
            });
        }

        for (const s of order.sundries) {
            if (!s.accountId) throw new BadRequestException(`Sundry ${s.name} missing account`);

            if (s.type === 'add') {
                lines.push({
                    accountId: s.accountId,
                    description: s.name,
                    debit: s.amount.toNumber(),
                    credit: 0
                });
            } else {
                lines.push({
                    accountId: s.accountId,
                    description: s.name,
                    debit: 0,
                    credit: s.amount.toNumber()
                });
            }
        }

        // Party Line (Credit) to balance
        lines.push({
            partyId: order.partyId,
            accountId: payable.id,
            description: `Purchase for ${order.orderNo}`,
            debit: 0,
            credit: order.total.toNumber()
        });

        const draftInput = {
            voucherType: VoucherType.purchase,
            voucherDate: new Date(),
            partyId: order.partyId,
            referenceNo: order.orderNo || undefined,
            memo: order.memo || undefined,
            additionalNote: order.additionalNote || undefined,
            lines
        };

        return await this.vouchersService.createDraft(user, draftInput as any);
    }
}
