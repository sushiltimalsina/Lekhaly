import { ForbiddenException, Injectable, Logger, UnauthorizedException, InternalServerErrorException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { JwtSignOptions } from "@nestjs/jwt";
import { PrismaService } from "../../common/prisma/prisma.service";
import { Prisma } from "@prisma/client";
import { FiscalSessionsService } from "../fiscal-sessions/fiscal-sessions.service";
import argon2 from "argon2";
import * as speakeasy from "speakeasy";
import * as qrcode from "qrcode";
import crypto from "crypto";
import { encryptTotpSecret, decryptTotpSecret } from "../../common/auth/totp-crypto";

type JwtAccessPayload = {
  sub: string; // userId
  companyId: string;
  perms: string[];
  step: "none" | "sensitive";
  ver: number; // trustedDeviceVersion
};

type JwtRefreshPayload = {
  sub: string;
  companyId: string;
  ver: number;
  typ: "refresh";
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private fiscalSessions: FiscalSessionsService
  ) { }

  private async getUserWithPerms(companyId: string, email: string) {
    const user = await this.prisma.user.findUnique({
      where: { companyId_email: { companyId, email } },
      include: { userRoles: { include: { role: { include: { rolePermissions: true } } } } }
    });
    if (!user) return null;

    const perms = new Set<string>();
    for (const ur of user.userRoles) {
      for (const rp of ur.role.rolePermissions) perms.add(rp.permissionCode);
    }
    return { user, perms: Array.from(perms) };
  }

  private async getUserWithPermsById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userRoles: { include: { role: { include: { rolePermissions: true } } } } }
    });
    if (!user) return null;

    const perms = new Set<string>();
    for (const ur of user.userRoles) {
      for (const rp of ur.role.rolePermissions) perms.add(rp.permissionCode);
    }
    return { user, perms: Array.from(perms) };
  }

  private signAccessToken(payload: JwtAccessPayload) {
    const issuer = process.env.JWT_ISSUER;
    const audience = process.env.JWT_AUDIENCE;
    const signOptions: JwtSignOptions = { expiresIn: 900 };
    if (issuer) signOptions.issuer = issuer;
    if (audience) signOptions.audience = audience;
    return this.jwt.sign(payload, signOptions);
  }

  private signRefreshToken(userId: string, companyId: string, version: number) {
    const issuer = process.env.JWT_ISSUER;
    const audience = process.env.JWT_AUDIENCE;
    const signOptions: JwtSignOptions = { expiresIn: 30 * 24 * 60 * 60 };
    if (issuer) signOptions.issuer = issuer;
    if (audience) signOptions.audience = audience;
    return this.jwt.sign({ sub: userId, companyId, ver: version, typ: "refresh" }, signOptions);
  }

  private sha256(s: string) {
    return crypto.createHash("sha256").update(s).digest("hex");
  }

  private async ensurePermissions(tx: Prisma.TransactionClient) {
    const permissions = [
      { code: "masters.read", description: "Read masters" },
      { code: "masters.write", description: "Create/update masters" },
      { code: "voucher.draft.create", description: "Create voucher drafts" },
      { code: "voucher.draft.edit", description: "Edit voucher drafts" },
      { code: "voucher.preview", description: "Preview voucher posting" },
      { code: "voucher.post", description: "Post vouchers" },
      { code: "voucher.void", description: "Void vouchers" },
      { code: "reports.view", description: "View reports" },
      { code: "export.pdf", description: "Export PDFs" },
      { code: "settings.security", description: "Manage security settings" },
      { code: "settings.tax", description: "Manage tax settings" },
      { code: "settings.coa", description: "Manage chart of accounts" },
      { code: "settings.users", description: "Manage users/roles" },
      { code: "manage.billSundries", description: "Manage bill sundries" }
    ];

    for (const p of permissions) {
      await tx.permission.upsert({
        where: { code: p.code },
        update: { description: p.description },
        create: p
      });
    }

    return permissions.map(p => p.code);
  }

  private async createDefaultMasterData(tx: Prisma.TransactionClient, companyId: string) {
    // Create default Chart of Accounts
    const cash = await tx.chartOfAccount.create({
      data: { companyId, code: "1010", name: "Cash in Hand", type: "asset" }
    });
    const bank = await tx.chartOfAccount.create({
      data: { companyId, code: "1020", name: "Bank", type: "asset" }
    });
    const ar = await tx.chartOfAccount.create({
      data: { companyId, code: "1100", name: "Accounts Receivable", type: "asset" }
    });
    const vatReceivable = await tx.chartOfAccount.create({
      data: { companyId, code: "1110", name: "VAT Receivable", type: "asset" }
    });
    await tx.chartOfAccount.create({
      data: { companyId, code: "1200", name: "Inventory", type: "asset" }
    });

    const ap = await tx.chartOfAccount.create({
      data: { companyId, code: "2000", name: "Accounts Payable", type: "liability" }
    });
    const vatPayable = await tx.chartOfAccount.create({
      data: { companyId, code: "2100", name: "VAT Payable", type: "liability" }
    });

    await tx.chartOfAccount.create({
      data: { companyId, code: "3000", name: "Owner's Capital", type: "equity" }
    });

    const sales = await tx.chartOfAccount.create({
      data: { companyId, code: "4000", name: "Sales", type: "income" }
    });
    const discountGiven = await tx.chartOfAccount.create({
      data: { companyId, code: "4100", name: "Discount Given", type: "income" }
    });
    const shippingIncome = await tx.chartOfAccount.create({
      data: { companyId, code: "4200", name: "Shipping & Handling Income", type: "income" }
    });

    const cogs = await tx.chartOfAccount.create({
      data: { companyId, code: "5000", name: "Cost of Goods Sold", type: "expense" }
    });
    const discountReceived = await tx.chartOfAccount.create({
      data: { companyId, code: "5100", name: "Discount Received", type: "expense" }
    });
    const shippingExpense = await tx.chartOfAccount.create({
      data: { companyId, code: "5200", name: "Shipping & Handling Expense", type: "expense" }
    });

    // Create default Tax Codes
    await tx.taxCode.create({
      data: {
        companyId,
        name: "VAT 13%",
        rate: 13.0,
        isInclusive: false,
        inputTaxAccountId: vatReceivable.id,
        outputTaxAccountId: vatPayable.id
      }
    });

    await tx.taxCode.createMany({
      data: [
        {
          companyId,
          name: "Digital Service Tax (DST) 2%",
          rate: 2.0,
          isInclusive: false,
          inputTaxAccountId: vatReceivable.id,
          outputTaxAccountId: vatPayable.id
        },
        {
          companyId,
          name: "Excise Duty",
          rate: 0.0,
          isInclusive: false,
          inputTaxAccountId: vatReceivable.id,
          outputTaxAccountId: vatPayable.id
        }
      ],
      skipDuplicates: true
    });

    // Create default Bill Sundries (Discount, Shipping, etc.)
    await tx.billSundry.createMany({
      data: [
        {
          companyId,
          name: "Discount",
          type: "less",
          rate: 0,
          accountId: discountGiven.id,
          isActive: true
        },
        {
          companyId,
          name: "VAT",
          type: "add",
          rate: 13,
          accountId: vatPayable.id,
          isActive: true
        },
        {
          companyId,
          name: "Shipping & Handling",
          type: "add",
          rate: 0,
          accountId: shippingIncome.id,
          isActive: true
        },
        {
          companyId,
          name: "Packaging Charges",
          type: "add",
          rate: 0,
          accountId: shippingIncome.id,
          isActive: true
        },
        {
          companyId,
          name: "Insurance",
          type: "add",
          rate: 0,
          accountId: shippingIncome.id,
          isActive: true
        },
        {
          companyId,
          name: "Round Off",
          type: "add",
          rate: 0,
          accountId: sales.id,
          isActive: true
        }
      ],
      skipDuplicates: true
    });

    // Create default party (Walk-in Customer)
    await tx.party.create({
      data: { companyId, type: "customer", name: "Walk-in Customer" }
    });

    return { cash, bank, ar, ap, sales, cogs };
  }

  async register(dto: { companyCode: string; companyName: string; name: string; email: string; password: string }) {
    const passwordHash = await argon2.hash(dto.password);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const permAll = await this.ensurePermissions(tx);

        const company = await tx.company.create({
          data: {
            code: dto.companyCode,
            name: dto.companyName,
            baseCurrency: "NPR",
            timezone: "Asia/Kathmandu",
            fiscalYearStartMonth: 4,
            invoicePrefix: "SI",
            purchasePrefix: "PURI",
            salesReturnPrefix: "SR",
            purchaseReturnPrefix: "PR",
            orderPrefix: "SO",
            quotationPrefix: "QT",
            purchaseOrderPrefix: "PO",
            receiptPrefix: "RV",
            paymentPrefix: "PV",
            journalPrefix: "JV",
            invoiceSuffix: "80/81",
            purchaseSuffix: "80/81",
            salesReturnSuffix: "80/81",
            purchaseReturnSuffix: "80/81",
            orderSuffix: "80/81",
            quotationSuffix: "80/81",
            purchaseOrderSuffix: "80/81",
            receiptSuffix: "80/81",
            paymentSuffix: "80/81",
            journalSuffix: "80/81",
            nextInvoiceNumber: 1
          }
        });

        const [adminRole, accountantRole, salesRole, viewerRole] = await Promise.all([
          tx.role.create({ data: { companyId: company.id, name: "Admin" } }),
          tx.role.create({ data: { companyId: company.id, name: "Accountant" } }),
          tx.role.create({ data: { companyId: company.id, name: "Sales" } }),
          tx.role.create({ data: { companyId: company.id, name: "Viewer" } })
        ]);

        const permSales = ["masters.read", "voucher.draft.create", "voucher.draft.edit", "voucher.preview", "reports.view", "export.pdf"];
        const permViewer = ["masters.read", "reports.view"];

        const attach = async (roleId: string, codes: string[]) => {
          await tx.rolePermission.createMany({
            data: codes.map(code => ({ roleId, permissionCode: code })),
            skipDuplicates: true
          });
        };

        await attach(adminRole.id, permAll);
        await attach(accountantRole.id, permAll);
        await attach(salesRole.id, permSales);
        await attach(viewerRole.id, permViewer);

        const user = await tx.user.create({
          data: {
            companyId: company.id,
            email: dto.email,
            name: dto.name,
            passwordHash
          }
        });
        await tx.userRole.create({ data: { userId: user.id, roleId: adminRole.id } });

        // Create default master data (COA, Tax Codes, Bill Sundries, etc.)
        await this.createDefaultMasterData(tx, company.id);

        return { companyId: company.id, userId: user.id };
      });
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new ForbiddenException("Email already in use");
      }
      throw e;
    }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, companyId: true }
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }

  async updateProfile(userId: string, dto: { name?: string; email?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, companyId: true }
    });
    if (!user) throw new UnauthorizedException();

    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findFirst({
        where: { companyId: user.companyId, email: dto.email }
      });
      if (existing) throw new ForbiddenException("Email already in use");
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { name: dto.name ?? undefined, email: dto.email ?? undefined },
      select: { id: true, email: true, name: true, companyId: true }
    });
  }

  async getCompany(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true }
    });
    if (!user) throw new UnauthorizedException();
    return this.prisma.company.findUnique({
      where: { id: user.companyId },
      select: {
        id: true,
        name: true,
        baseCurrency: true,
        timezone: true,
        fiscalYearStartMonth: true,
        invoicePrefix: true,
        purchasePrefix: true,
        salesReturnPrefix: true,
        purchaseReturnPrefix: true,
        orderPrefix: true,
        quotationPrefix: true,
        purchaseOrderPrefix: true,
        receiptPrefix: true,
        paymentPrefix: true,
        journalPrefix: true,
        invoiceSuffix: true,
        purchaseSuffix: true,
        salesReturnSuffix: true,
        purchaseReturnSuffix: true,
        orderSuffix: true,
        quotationSuffix: true,
        purchaseOrderSuffix: true,
        receiptSuffix: true,
        paymentSuffix: true,
        journalSuffix: true,
        nextInvoiceNumber: true,
        nextPurchaseNumber: true,
        nextSalesReturnNumber: true,
        nextPurchaseReturnNumber: true,
        nextOrderNumber: true,
        nextQuotationNumber: true,
        nextPurchaseOrderNumber: true,
        nextReceiptNumber: true,
        nextPaymentNumber: true,
        nextJournalNumber: true,
        lockDate: true,
        creditLimitAmount: true,
        printLogo: true,
        address: true,
        phone: true,
        email: true,
        panNumber: true,
        vatNumber: true,
      } as any
    });
  }

  async updateCompany(userId: string, dto: {
    name?: string;
    baseCurrency?: string;
    timezone?: string;
    fiscalYearStartMonth?: number;
    invoicePrefix?: string;
    purchasePrefix?: string;
    salesReturnPrefix?: string;
    purchaseReturnPrefix?: string;
    orderPrefix?: string;
    quotationPrefix?: string;
    purchaseOrderPrefix?: string;
    receiptPrefix?: string;
    paymentPrefix?: string;
    journalPrefix?: string;
    invoiceSuffix?: string;
    purchaseSuffix?: string;
    salesReturnSuffix?: string;
    purchaseReturnSuffix?: string;
    orderSuffix?: string;
    quotationSuffix?: string;
    purchaseOrderSuffix?: string;
    receiptSuffix?: string;
    paymentSuffix?: string;
    journalSuffix?: string;
    nextInvoiceNumber?: number;
    nextPurchaseNumber?: number;
    nextSalesReturnNumber?: number;
    nextPurchaseReturnNumber?: number;
    nextOrderNumber?: number;
    nextQuotationNumber?: number;
    nextPurchaseOrderNumber?: number;
    nextReceiptNumber?: number;
    nextPaymentNumber?: number;
    nextJournalNumber?: number;
    lockDate?: string | null;
    creditLimitAmount?: number;
    printLogo?: boolean;
    address?: string;
    phone?: string;
    email?: string;
    panNumber?: string;
    vatNumber?: string;
  }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true }
    });
    if (!user) throw new UnauthorizedException();

    return this.prisma.company.update({
      where: { id: user.companyId },
      data: {
        name: dto.name ?? undefined,
        baseCurrency: dto.baseCurrency ?? undefined,
        timezone: dto.timezone ?? undefined,
        fiscalYearStartMonth: dto.fiscalYearStartMonth ?? undefined,
        invoicePrefix: dto.invoicePrefix ?? undefined,
        purchasePrefix: dto.purchasePrefix ?? undefined,
        salesReturnPrefix: dto.salesReturnPrefix ?? undefined,
        purchaseReturnPrefix: dto.purchaseReturnPrefix ?? undefined,
        orderPrefix: dto.orderPrefix ?? undefined,
        quotationPrefix: dto.quotationPrefix ?? undefined,
        purchaseOrderPrefix: dto.purchaseOrderPrefix ?? undefined,
        receiptPrefix: dto.receiptPrefix ?? undefined,
        paymentPrefix: dto.paymentPrefix ?? undefined,
        journalPrefix: dto.journalPrefix ?? undefined,
        invoiceSuffix: dto.invoiceSuffix ?? undefined,
        purchaseSuffix: dto.purchaseSuffix ?? undefined,
        salesReturnSuffix: dto.salesReturnSuffix ?? undefined,
        purchaseReturnSuffix: dto.purchaseReturnSuffix ?? undefined,
        orderSuffix: dto.orderSuffix ?? undefined,
        quotationSuffix: dto.quotationSuffix ?? undefined,
        purchaseOrderSuffix: dto.purchaseOrderSuffix ?? undefined,
        receiptSuffix: dto.receiptSuffix ?? undefined,
        paymentSuffix: dto.paymentSuffix ?? undefined,
        journalSuffix: dto.journalSuffix ?? undefined,
        nextInvoiceNumber: dto.nextInvoiceNumber ?? undefined,
        nextPurchaseNumber: dto.nextPurchaseNumber ?? undefined,
        nextSalesReturnNumber: dto.nextSalesReturnNumber ?? undefined,
        nextPurchaseReturnNumber: dto.nextPurchaseReturnNumber ?? undefined,
        nextOrderNumber: dto.nextOrderNumber ?? undefined,
        nextQuotationNumber: dto.nextQuotationNumber ?? undefined,
        nextPurchaseOrderNumber: dto.nextPurchaseOrderNumber ?? undefined,
        nextReceiptNumber: dto.nextReceiptNumber ?? undefined,
        nextPaymentNumber: dto.nextPaymentNumber ?? undefined,
        nextJournalNumber: dto.nextJournalNumber ?? undefined,
        lockDate: dto.lockDate !== undefined ? (dto.lockDate ? new Date(dto.lockDate) : null) : undefined,
        creditLimitAmount: dto.creditLimitAmount ?? undefined,
        printLogo: dto.printLogo ?? undefined,
        address: dto.address ?? undefined,
        phone: dto.phone ?? undefined,
        email: dto.email ?? undefined,
        panNumber: dto.panNumber ?? undefined,
        vatNumber: dto.vatNumber ?? undefined,
      } as any,
      select: {
        id: true,
        name: true,
        baseCurrency: true,
        timezone: true,
        fiscalYearStartMonth: true,
        invoicePrefix: true,
        purchasePrefix: true,
        salesReturnPrefix: true,
        purchaseReturnPrefix: true,
        orderPrefix: true,
        quotationPrefix: true,
        purchaseOrderPrefix: true,
        receiptPrefix: true,
        paymentPrefix: true,
        journalPrefix: true,
        invoiceSuffix: true,
        purchaseSuffix: true,
        salesReturnSuffix: true,
        purchaseReturnSuffix: true,
        orderSuffix: true,
        quotationSuffix: true,
        purchaseOrderSuffix: true,
        receiptSuffix: true,
        paymentSuffix: true,
        journalSuffix: true,
        nextInvoiceNumber: true,
        nextPurchaseNumber: true,
        nextSalesReturnNumber: true,
        nextPurchaseReturnNumber: true,
        nextOrderNumber: true,
        nextQuotationNumber: true,
        nextPurchaseOrderNumber: true,
        nextReceiptNumber: true,
        nextPaymentNumber: true,
        nextJournalNumber: true,
        lockDate: true,
        creditLimitAmount: true,
        printLogo: true,
        address: true,
        phone: true,
        email: true,
        panNumber: true,
        vatNumber: true,
      } as any
    });
  }

  async logoutAll(userId: string) {
    await this.prisma.authSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
    // Increment trustedDeviceVersion to invalidate all existing tokens immediately
    await this.prisma.user.update({
      where: { id: userId },
      data: { trustedDeviceVersion: { increment: 1 } }
    });
    return { ok: true };
  }

  async updateNotifications(userId: string, dto: {
    emailAlerts?: boolean;
    reportAlerts?: boolean;
    securityAlerts?: boolean;
  }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true }
    });
    if (!user) throw new UnauthorizedException();

    await this.prisma.outboxEvent.create({
      data: {
        companyId: user.companyId,
        type: "notifications.update",
        payload: {
          userId,
          ...dto
        }
      }
    });

    return { ok: true };
  }

  async startBillingPortal(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true }
    });
    if (!user) throw new UnauthorizedException();

    await this.prisma.outboxEvent.create({
      data: {
        companyId: user.companyId,
        type: "billing.portal",
        payload: { userId }
      }
    });

    return { ok: true };
  }

  async login(dto: {
    companyCode: string;
    email: string;
    password: string;
    totpCode?: string;
    deviceId?: string;
    deviceLabel?: string;
    rememberDevice?: boolean;
  }) {
    this.logger.debug(`Login attempt for ${dto.email}@${dto.companyCode}`);
    try {
      this.logger.debug('Finding user...');
      const company = await this.prisma.company.findUnique({ 
        where: { code: dto.companyCode },
        select: { id: true, code: true, name: true, baseCurrency: true, timezone: true } as any
      }) as any;
      if (!company) throw new UnauthorizedException("Invalid credentials");
      const found = await this.getUserWithPerms(company.id, dto.email);
      if (!found) {
        this.logger.warn(`Login failed: user not found for ${dto.email}`);
        throw new UnauthorizedException("Invalid credentials");
      }

      const { user, perms } = found;
      this.logger.debug(`User found: ${user.id}, status: ${user.status}`);

      if (user.status !== "active") {
        this.logger.warn(`Login failed: user ${user.id} is disabled`);
        throw new ForbiddenException("User disabled");
      }

      this.logger.debug('Verifying password...');
      const ok = await argon2.verify(user.passwordHash, dto.password);
      if (!ok) {
        this.logger.warn(`Login failed: password mismatch for ${user.id}`);
        throw new UnauthorizedException("Invalid credentials");
      }

      this.logger.debug('Checking TOTP...');
      let trustedDevice: { id: string; trusted: boolean } | null = null;
      if (dto.deviceId) {
        const link = await this.prisma.deviceUserLink.findFirst({
          where: { deviceId: dto.deviceId, userId: user.id },
          include: { device: true }
        });
        if (link?.device && link.device.companyId === user.companyId) {
          trustedDevice = { id: link.device.id, trusted: link.device.trusted };
          await this.prisma.device.update({
            where: { id: link.device.id },
            data: { lastSeenAt: new Date() }
          });
        }
      }

      // If TOTP enabled, allow trusted devices to skip the code.
      if (user.totpEnabled && !trustedDevice?.trusted) {
        if (!dto.totpCode) throw new UnauthorizedException("TOTP required");
        const encSecret = user.totpSecretEnc;
        if (!encSecret) throw new UnauthorizedException("TOTP secret missing");
        const secret = decryptTotpSecret(encSecret);

        const valid = speakeasy.totp.verify({
          secret,
          encoding: "base32",
          token: dto.totpCode,
          window: 1
        });
        if (!valid) {
          this.logger.warn(`Login failed: invalid TOTP for ${user.id}`);
          throw new UnauthorizedException("Invalid TOTP");
        }
      }

      // Device registration (minimal)
      let deviceId: string | null = trustedDevice?.id || null;
      if (dto.deviceLabel) {
        this.logger.debug('Registering device...');
        const device = await this.prisma.device.create({
          data: {
            companyId: user.companyId,
            label: dto.deviceLabel,
            platform: "web",
            trusted: Boolean(dto.rememberDevice)
          }
        });
        deviceId = device.id;
        await this.prisma.deviceUserLink.create({ data: { deviceId: device.id, userId: user.id } });
      } else if (trustedDevice?.id && dto.rememberDevice && !trustedDevice.trusted) {
        await this.prisma.device.update({
          where: { id: trustedDevice.id },
          data: { trusted: true }
        });
      }

      this.logger.debug('Signing tokens...');
      const access = this.signAccessToken({
        sub: user.id,
        companyId: user.companyId,
        perms,
        step: "none",
        ver: user.trustedDeviceVersion
      });

      const refresh = this.signRefreshToken(user.id, user.companyId, user.trustedDeviceVersion);

      this.logger.debug('Creating session...');
      await this.prisma.authSession.create({
        data: {
          userId: user.id,
          deviceId,
          refreshTokenHash: this.sha256(refresh),
          trustedUntil: dto.rememberDevice ? new Date(Date.now() + 30 * 24 * 3600 * 1000) : null
        }
      });

      this.logger.debug('Updating last login...');
      await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

      this.logger.debug('Auto-detecting fiscal session...');
      await this.fiscalSessions.initActiveSession(user.companyId);

      this.logger.log(`Login successful for user ${user.id}`);
      return { accessToken: access, refreshToken: refresh, userId: user.id, companyId: user.companyId, perms, deviceId };
    } catch (e: any) {
      this.logger.error(`Login error: ${e.message || e}`, e.stack);
      if (e instanceof UnauthorizedException || e instanceof ForbiddenException) throw e;
      throw new InternalServerErrorException(`Login failed: ${e.message || e}`);
    }
  }

  async refresh(dto: { refreshToken: string }) {
    try {
      const issuer = process.env.JWT_ISSUER;
      const audience = process.env.JWT_AUDIENCE;
      const verifyOptions: { issuer?: string; audience?: string } = {};
      if (issuer) verifyOptions.issuer = issuer;
      if (audience) verifyOptions.audience = audience;
      const payload = this.jwt.verify(dto.refreshToken, verifyOptions) as JwtRefreshPayload;
      if (payload.typ !== "refresh") throw new UnauthorizedException("Invalid token");

      const session = await this.prisma.authSession.findFirst({
        where: {
          userId: payload.sub,
          refreshTokenHash: this.sha256(dto.refreshToken),
          revokedAt: null
        }
      });
      if (!session) throw new UnauthorizedException("Invalid token");

      const found = await this.getUserWithPermsById(payload.sub);
      if (!found) throw new UnauthorizedException("Invalid token");
      const { user, perms } = found;
      if (user.companyId !== payload.companyId) throw new UnauthorizedException("Invalid token");
      if (payload.ver !== user.trustedDeviceVersion) throw new UnauthorizedException("Invalid token");
      if (user.status !== "active") throw new ForbiddenException("User disabled");

      const access = this.signAccessToken({
        sub: user.id,
        companyId: user.companyId,
        perms,
        step: "none",
        ver: user.trustedDeviceVersion
      });

      const refresh = this.signRefreshToken(user.id, user.companyId, user.trustedDeviceVersion);

      await this.prisma.authSession.update({
        where: { id: session.id },
        data: { refreshTokenHash: this.sha256(refresh), lastUsedAt: new Date() }
      });

      return { accessToken: access, refreshToken: refresh, userId: user.id, companyId: user.companyId, perms };
    } catch (e: any) {
      if (e instanceof UnauthorizedException || e instanceof ForbiddenException) throw e;
      throw new UnauthorizedException("Invalid token");
    }
  }

  async logout(refreshToken: string) {
    const tokenHash = this.sha256(refreshToken);
    await this.prisma.authSession.updateMany({
      where: { refreshTokenHash: tokenHash, revokedAt: null },
      data: { revokedAt: new Date() }
    });
    return { ok: true };
  }

  async totpSetup(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const secret = speakeasy.generateSecret({
      name: `Lekhaly (${user.email})`,
      length: 20
    });

    // Encrypt the TOTP secret before storing at rest
    const encrypted = encryptTotpSecret(secret.base32);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { totpSecretEnc: encrypted }
    });

    const qrDataUrl = await qrcode.toDataURL(secret.otpauth_url!);
    return { base32: secret.base32, otpauthUrl: secret.otpauth_url, qrDataUrl };
  }

  async totpEnable(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.totpSecretEnc) throw new ForbiddenException("Setup TOTP first");

    const decryptedSecret = decryptTotpSecret(user.totpSecretEnc);
    const valid = speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: "base32",
      token: code,
      window: 1
    });
    if (!valid) throw new UnauthorizedException("Invalid code");

    // Generate backup codes (store hashes)
    const backupCodesPlain = Array.from({ length: 8 }).map(() => crypto.randomBytes(5).toString("hex"));
    await this.prisma.backupCode.createMany({
      data: backupCodesPlain.map(c => ({ userId: user.id, codeHash: this.sha256(c) }))
    });

    await this.prisma.user.update({ where: { id: user.id }, data: { totpEnabled: true } });

    return { enabled: true, backupCodes: backupCodesPlain };
  }

  async stepUp(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.totpEnabled || !user.totpSecretEnc) throw new ForbiddenException("TOTP not enabled");

    const decryptedSecret = decryptTotpSecret(user.totpSecretEnc);
    const valid = speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: "base32",
      token: code,
      window: 1
    });
    if (!valid) throw new UnauthorizedException("Invalid code");

    // Step-up token valid for 10 minutes
    const found = await this.getUserWithPermsById(user.id);
    if (!found) throw new UnauthorizedException();

    const access = this.signAccessToken({
      sub: user.id,
      companyId: user.companyId,
      perms: found.perms,
      step: "sensitive",
      ver: user.trustedDeviceVersion
    });

    return { stepUpToken: access };
  }
}
