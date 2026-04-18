import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuthUser } from "../../common/auth/auth.types";

@Injectable()
export class FiscalSessionsService {
  constructor(private prisma: PrismaService) {}

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

    return this.prisma.$transaction(async (tx) => {
      const session = await tx.fiscalSession.create({
        data: {
          companyId: user.companyId,
          name: dto.name,
          startDate: dto.startDate,
          endDate: dto.endDate,
          
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

          invoiceSuffix: dto.invoiceSuffix ?? company.invoiceSuffix,
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
          data: { activeFiscalSessionId: session.id },
        });
      }

      return session;
    });
  }

  async switchSession(user: AuthUser, sessionId: string) {
    const session = await this.prisma.fiscalSession.findFirst({
      where: { id: sessionId, companyId: user.companyId },
    });
    if (!session) throw new NotFoundException("Fiscal session not found");

    await this.prisma.company.update({
      where: { id: user.companyId },
      data: { activeFiscalSessionId: session.id },
    });

    return { success: true, activeFiscalSessionId: session.id };
  }

  async lockSession(user: AuthUser, sessionId: string, lock: boolean) {
    const session = await this.prisma.fiscalSession.findFirst({
      where: { id: sessionId, companyId: user.companyId },
    });
    if (!session) throw new NotFoundException("Fiscal session not found");

    return this.prisma.fiscalSession.update({
      where: { id: sessionId },
      data: { isLocked: lock },
    });
  }
}
