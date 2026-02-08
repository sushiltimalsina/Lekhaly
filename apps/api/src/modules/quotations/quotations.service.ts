import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, QuotationStatus } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthUser } from "../../common/auth/auth.types";
import { resolveAdDate } from "../../common/date/nepali-date";

@Injectable()
export class QuotationsService {
    constructor(private prisma: PrismaService) { }

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
        if (!party) throw new BadRequestException("Customer not found");

        const resolvedDate = resolveAdDate(input.quotationDate, input.quotationDateBs);
        const resolvedExpiry = input.expiryDate || input.expiryDateBs
            ? resolveAdDate(input.expiryDate, input.expiryDateBs)
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

        const company = await this.prisma.company.findUnique({ where: { id: user.companyId } });
        if (!company) throw new BadRequestException("Company not found");
        const sequence = company.nextQuotationNumber;
        const quotationNo = `${company.quotationPrefix || "QT"}-${sequence}`;

        return await this.prisma.$transaction(async (tx) => {
            await tx.company.update({
                where: { id: company.id },
                data: { nextQuotationNumber: sequence + 1 }
            });

            return await tx.quotation.create({
                data: {
                    companyId: user.companyId,
                    partyId: input.partyId,
                    quotationNo,
                    status: QuotationStatus.draft,
                    date: resolvedDate.date,
                    dateBs: resolvedDate.bs || input.quotationDateBs,
                    expiryDate: resolvedExpiry.date,
                    expiryDateBs: resolvedExpiry.bs || input.expiryDateBs,
                    referenceNo: input.referenceNo,
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

    async list(user: AuthUser, filters: any) {
        const where: Prisma.QuotationWhereInput = { companyId: user.companyId };
        if (filters.status) where.status = filters.status;
        if (filters.from || filters.to) {
            where.date = {};
            if (filters.from) (where.date as Prisma.DateTimeFilter).gte = filters.from;
            if (filters.to) (where.date as Prisma.DateTimeFilter).lte = filters.to;
        }

        if (filters.q) {
            where.OR = [
                { quotationNo: { contains: filters.q, mode: "insensitive" } },
                { referenceNo: { contains: filters.q, mode: "insensitive" } },
                { memo: { contains: filters.q, mode: "insensitive" } },
                { party: { name: { contains: filters.q, mode: "insensitive" } } }
            ];
        }

        const [total, data] = await this.prisma.$transaction([
            this.prisma.quotation.count({ where }),
            this.prisma.quotation.findMany({
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

        return {
            data,
            meta: {
                total,
                page: Math.floor((filters.skip || 0) / (filters.take || 50)) + 1,
                lastPage: Math.ceil(total / (filters.take || 50))
            }
        };
    }

    async getById(user: AuthUser, id: string) {
        const quotation = await this.prisma.quotation.findFirst({
            where: { id, companyId: user.companyId },
            include: {
                items: { include: { item: { select: { name: true, unit: true } } } },
                sundries: true,
                party: true
            }
        });
        if (!quotation) throw new NotFoundException("Quotation not found");
        return quotation;
    }

    async updateStatus(user: AuthUser, id: string, status: QuotationStatus) {
        const quotation = await this.prisma.quotation.findFirst({
            where: { id, companyId: user.companyId }
        });
        if (!quotation) throw new NotFoundException("Quotation not found");
        return this.prisma.quotation.update({
            where: { id },
            data: { status }
        });
    }

    async convertToSalesOrder(user: AuthUser, id: string) {
        const quotation = await this.prisma.quotation.findFirst({
            where: { id, companyId: user.companyId },
            include: { items: true, sundries: true }
        });
        if (!quotation) throw new NotFoundException("Quotation not found");
        // if (quotation.status !== QuotationStatus.accepted) throw new BadRequestException("Only accepted quotations can be converted");

        const company = await this.prisma.company.findUnique({ where: { id: user.companyId } });
        if (!company) throw new BadRequestException("Company not found");
        const sequence = company.nextOrderNumber;
        const orderNo = `${company.orderPrefix || "SO"}-${sequence}`;
        const salesStatus = "draft"; // Prisma enum for SalesOrderStatus usually has draft? Check schema.
        // SalesOrderStatus: draft, open, fulfilled, cancelled. default draft.

        // Actually SalesOrdersService uses 'open' status for new orders in create().
        // But maybe converted inputs should be draft?
        // Let's create it as draft if schema allows, or open. schema has default(draft).

        // Logic similar to create but using quotation data
        const { subtotal, vatAmount, total } = this.computeTotals(quotation.items.map(i => ({
            qty: i.qty.toNumber(),
            rate: i.rate.toNumber(),
            taxAmount: i.taxAmount
        })));

        return await this.prisma.$transaction(async (tx) => {
            await tx.company.update({
                where: { id: company.id },
                data: { nextOrderNumber: sequence + 1 }
            });

            // Need to import SalesOrderStatus or use string if compatible
            // Let's rely on Prisma types being available or just string literal "draft" | "open"

            return await tx.salesOrder.create({
                data: {
                    companyId: user.companyId,
                    partyId: quotation.partyId,
                    quotationId: quotation.id,
                    orderNo,
                    status: "draft", // Start as draft so user can review
                    date: new Date(),
                    // dateBs? could resolve or leave null
                    expectedDelivery: quotation.expiryDate, // Maybe?
                    // expectedDeliveryBs: quotation.expiryDateBs,
                    memo: quotation.memo,
                    additionalNote: quotation.additionalNote,
                    terms: quotation.terms,
                    items: {
                        create: quotation.items.map(item => ({
                            itemId: item.itemId,
                            description: item.description,
                            qty: item.qty,
                            rate: item.rate,
                            amount: item.amount,
                            taxCodeId: item.taxCodeId,
                            taxAmount: item.taxAmount
                        }))
                    },
                    sundries: {
                        create: quotation.sundries.map(s => ({
                            billSundryId: s.billSundryId,
                            name: s.name,
                            type: s.type,
                            rate: s.rate,
                            amount: s.amount
                        }))
                    },
                    subtotal: quotation.subtotal,
                    vatAmount: quotation.vatAmount,
                    total: quotation.total
                }
            });
        });
    }
}
