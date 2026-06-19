import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, SalesOrderStatus } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";
import { resolveAdDate } from "../../common/date/nepali-date";

import { InvoicesService } from "../invoices/invoices.service";

@Injectable()
export class SalesOrdersService {
    constructor(
        private prisma: PrismaService,
        private invoicesService: InvoicesService
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

    private async tryReserveOrderItems(tx: Prisma.TransactionClient, companyId: string, order: any) {
        const db = tx as any;
        if (!db.stockReservation) return;

        for (const line of order.items ?? []) {
            if (!line.itemId) continue;
            const item = await tx.item.findFirst({
                where: { id: line.itemId, companyId },
                select: { id: true, type: true, trackInventory: true }
            });
            if (!item || item.type === "services" || item.trackInventory === false) continue;

            const requiredQty = new Prisma.Decimal(line.qty ?? 0).sub(new Prisma.Decimal(line.fulfilledQty ?? 0));
            if (requiredQty.lte(0)) continue;

            const [stock, reservations] = await Promise.all([
                tx.stockLedger.aggregate({
                    where: { companyId, itemId: line.itemId },
                    _sum: { qtyIn: true, qtyOut: true }
                }),
                db.stockReservation.findMany({
                    where: { companyId, itemId: line.itemId, status: { in: ["active", "partial"] } },
                    select: { reservedQty: true, releasedQty: true, fulfilledQty: true }
                }).catch(() => [])
            ]);

            const onHand = new Prisma.Decimal(stock._sum.qtyIn ?? 0).sub(new Prisma.Decimal(stock._sum.qtyOut ?? 0));
            const alreadyReserved = reservations.reduce(
                (sum: Prisma.Decimal, row: any) => sum.add(row.reservedQty).sub(row.releasedQty).sub(row.fulfilledQty),
                new Prisma.Decimal(0)
            );
            const available = onHand.sub(alreadyReserved);
            const reservedQty = Prisma.Decimal.min(requiredQty, available.gt(0) ? available : new Prisma.Decimal(0));

            await db.stockReservation.create({
                data: {
                    companyId,
                    salesOrderId: order.id,
                    salesOrderItemId: line.id,
                    itemId: line.itemId,
                    qty: requiredQty,
                    reservedQty,
                    fulfilledQty: new Prisma.Decimal(line.fulfilledQty ?? 0),
                    status: reservedQty.gte(requiredQty) ? "active" : "partial"
                }
            }).catch(() => null);
        }
    }

    private async releaseOrderReservations(tx: Prisma.TransactionClient, companyId: string, salesOrderId: string) {
        const db = tx as any;
        if (!db.stockReservation) return;
        const reservations = await db.stockReservation.findMany({
            where: { companyId, salesOrderId, status: { in: ["active", "partial"] } }
        }).catch(() => []);
        for (const reservation of reservations) {
            const openQty = reservation.reservedQty.sub(reservation.releasedQty).sub(reservation.fulfilledQty);
            await db.stockReservation.update({
                where: { id: reservation.id },
                data: {
                    releasedQty: reservation.releasedQty.add(openQty.gt(0) ? openQty : new Prisma.Decimal(0)),
                    status: "released"
                }
            }).catch(() => null);
        }
    }

    async create(user: AuthUser, input: any) {
        await this.validateItems(user.companyId, input.items);

        const party = await this.prisma.party.findFirst({
            where: { id: input.partyId, companyId: user.companyId }
        });
        if (!party) throw new BadRequestException("Customer not found");

        const resolvedDate = resolveAdDate(input.orderDate, input.orderDateBs);
        const resolvedDelivery = input.expectedDelivery || input.expectedDeliveryBs
            ? resolveAdDate(input.expectedDelivery, input.expectedDeliveryBs)
            : { date: null, bs: null };

        const itemIds = Array.from(new Set(input.items.map((i: any) => i.itemId).filter(Boolean))) as string[];
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

        const sequence = activeSession.nextOrderNumber;
        const p = activeSession.orderPrefix || "SO";
        const orderNo = `${p}-${sequence}`;

        return await this.prisma.$transaction(async (tx) => {
            await tx.fiscalSession.update({
                where: { id: activeSession.id },
                data: { nextOrderNumber: sequence + 1 }
            });

            const order = await tx.salesOrder.create({
                data: {
                    companyId: user.companyId,
                    partyId: input.partyId,
                    orderNo,
                    status: SalesOrderStatus.open,
                    date: resolvedDate.date,
                    dateBs: resolvedDate.bs || input.orderDateBs,
                    expectedDelivery: resolvedDelivery.date,
                    expectedDeliveryBs: resolvedDelivery.bs || input.expectedDeliveryBs,
                    customerPoRef: input.customerPoRef,
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
            await this.tryReserveOrderItems(tx, user.companyId, order);
            return order;
        });
    }

    async list(user: AuthUser, filters: any) {
        const where: Prisma.SalesOrderWhereInput = { companyId: user.companyId };
        if (filters.status) where.status = filters.status;
        if (filters.from || filters.to) {
            where.date = {};
            if (filters.from) (where.date as Prisma.DateTimeFilter).gte = filters.from;
            if (filters.to) (where.date as Prisma.DateTimeFilter).lte = filters.to;
        }

        if (filters.q) {
            where.OR = [
                { orderNo: { contains: filters.q, mode: "insensitive" } },
                { customerPoRef: { contains: filters.q, mode: "insensitive" } },
                { memo: { contains: filters.q, mode: "insensitive" } },
                { party: { name: { contains: filters.q, mode: "insensitive" } } }
            ];
        }

        return this.prisma.salesOrder.findMany({
            where,
            include: {
                party: { select: { id: true, name: true } },
                items: { include: { item: { select: { id: true, name: true } } } }
            },
            orderBy: { date: "desc" },
            skip: filters.skip || 0,
            take: filters.take || 50
        });
    }

    async getById(user: AuthUser, id: string) {
        const order = await this.prisma.salesOrder.findFirst({
            where: { id, companyId: user.companyId },
            include: {
                items: { include: { item: { select: { name: true, unit: true } } } },
                sundries: true,
                party: true
            }
        });
        if (!order) throw new NotFoundException("Sales order not found");
        return order;
    }

    async cancel(user: AuthUser, id: string) {
        const order = await this.prisma.salesOrder.findFirst({
            where: { id, companyId: user.companyId }
        });
        if (!order) throw new NotFoundException("Sales order not found");
        return this.prisma.$transaction(async (tx) => {
            const cancelled = await tx.salesOrder.update({
                where: { id },
                data: { status: SalesOrderStatus.cancelled }
            });
            await this.releaseOrderReservations(tx, user.companyId, id);
            return cancelled;
        });
    }

    async convertToInvoice(user: AuthUser, id: string) {
        const order = await this.prisma.salesOrder.findFirst({
            where: { id, companyId: user.companyId },
            include: {
                items: true,
                sundries: true
            }
        });

        if (!order) throw new NotFoundException("Sales order not found");
        if (order.status === SalesOrderStatus.cancelled) throw new BadRequestException("Cancelled orders cannot be converted");

        // Find a default receivable account
        const receivable = await this.prisma.chartOfAccount.findFirst({
            where: { companyId: user.companyId, type: "asset", isPostable: true },
            orderBy: { code: "desc" }
        });

        if (!receivable) throw new BadRequestException("No receivable account found. Please configure Chart of Accounts.");

        const invoiceInput = {
            type: "sales" as const,
            partyId: order.partyId,
            date: new Date(), // Today
            receivableAccountId: receivable.id,
            referenceNo: order.orderNo || undefined,
            memo: order.memo || undefined,
            additionalNote: order.additionalNote || undefined,
            items: order.items.map(item => ({
                itemId: item.itemId || undefined,
                description: item.description || undefined,
                qty: item.qty.toNumber(),
                rate: item.rate.toNumber(),
                taxCodeId: item.taxCodeId || undefined
            })),
            sundries: order.sundries.map(s => ({
                billSundryId: s.billSundryId || undefined,
                name: s.name,
                type: s.type as any,
                rate: s.rate ? s.rate.toNumber() : null,
                amount: s.amount.toNumber()
            }))
        };

        return await this.invoicesService.createDraft(user, invoiceInput);
    }
}
