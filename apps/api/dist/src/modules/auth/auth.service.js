"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const client_1 = require("@prisma/client");
const argon2_1 = __importDefault(require("argon2"));
const speakeasy = __importStar(require("speakeasy"));
const qrcode = __importStar(require("qrcode"));
const crypto_1 = __importDefault(require("crypto"));
const totp_crypto_1 = require("../../common/auth/totp-crypto");
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwt;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(prisma, jwt) {
        this.prisma = prisma;
        this.jwt = jwt;
    }
    async getUserWithPerms(companyId, email) {
        const user = await this.prisma.user.findUnique({
            where: { companyId_email: { companyId, email } },
            include: { userRoles: { include: { role: { include: { rolePermissions: true } } } } }
        });
        if (!user)
            return null;
        const perms = new Set();
        for (const ur of user.userRoles) {
            for (const rp of ur.role.rolePermissions)
                perms.add(rp.permissionCode);
        }
        return { user, perms: Array.from(perms) };
    }
    async getUserWithPermsById(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { userRoles: { include: { role: { include: { rolePermissions: true } } } } }
        });
        if (!user)
            return null;
        const perms = new Set();
        for (const ur of user.userRoles) {
            for (const rp of ur.role.rolePermissions)
                perms.add(rp.permissionCode);
        }
        return { user, perms: Array.from(perms) };
    }
    signAccessToken(payload) {
        const issuer = process.env.JWT_ISSUER;
        const audience = process.env.JWT_AUDIENCE;
        const signOptions = { expiresIn: 900 };
        if (issuer)
            signOptions.issuer = issuer;
        if (audience)
            signOptions.audience = audience;
        return this.jwt.sign(payload, signOptions);
    }
    signRefreshToken(userId, companyId, version) {
        const issuer = process.env.JWT_ISSUER;
        const audience = process.env.JWT_AUDIENCE;
        const signOptions = { expiresIn: 30 * 24 * 60 * 60 };
        if (issuer)
            signOptions.issuer = issuer;
        if (audience)
            signOptions.audience = audience;
        return this.jwt.sign({ sub: userId, companyId, ver: version, typ: "refresh" }, signOptions);
    }
    sha256(s) {
        return crypto_1.default.createHash("sha256").update(s).digest("hex");
    }
    async ensurePermissions(tx) {
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
    async createDefaultMasterData(tx, companyId) {
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
        await tx.party.create({
            data: { companyId, type: "customer", name: "Walk-in Customer" }
        });
        return { cash, bank, ar, ap, sales, cogs };
    }
    async register(dto) {
        const passwordHash = await argon2_1.default.hash(dto.password);
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
                        invoicePrefix: "INV",
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
                const attach = async (roleId, codes) => {
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
                await this.createDefaultMasterData(tx, company.id);
                return { companyId: company.id, userId: user.id };
            });
        }
        catch (e) {
            if (e instanceof client_1.Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
                throw new common_1.ForbiddenException("Email already in use");
            }
            throw e;
        }
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, name: true, companyId: true }
        });
        if (!user)
            throw new common_1.UnauthorizedException();
        return user;
    }
    async updateProfile(userId, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, companyId: true }
        });
        if (!user)
            throw new common_1.UnauthorizedException();
        if (dto.email && dto.email !== user.email) {
            const existing = await this.prisma.user.findFirst({
                where: { companyId: user.companyId, email: dto.email }
            });
            if (existing)
                throw new common_1.ForbiddenException("Email already in use");
        }
        return this.prisma.user.update({
            where: { id: userId },
            data: { name: dto.name ?? undefined, email: dto.email ?? undefined },
            select: { id: true, email: true, name: true, companyId: true }
        });
    }
    async getCompany(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { companyId: true }
        });
        if (!user)
            throw new common_1.UnauthorizedException();
        return this.prisma.company.findUnique({
            where: { id: user.companyId },
            select: {
                id: true,
                name: true,
                baseCurrency: true,
                timezone: true,
                fiscalYearStartMonth: true,
                invoicePrefix: true
            }
        });
    }
    async updateCompany(userId, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { companyId: true }
        });
        if (!user)
            throw new common_1.UnauthorizedException();
        return this.prisma.company.update({
            where: { id: user.companyId },
            data: {
                name: dto.name ?? undefined,
                baseCurrency: dto.baseCurrency ?? undefined,
                timezone: dto.timezone ?? undefined,
                fiscalYearStartMonth: dto.fiscalYearStartMonth ?? undefined,
                invoicePrefix: dto.invoicePrefix ?? undefined
            },
            select: {
                id: true,
                name: true,
                baseCurrency: true,
                timezone: true,
                fiscalYearStartMonth: true,
                invoicePrefix: true
            }
        });
    }
    async updateNotifications(userId, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { companyId: true }
        });
        if (!user)
            throw new common_1.UnauthorizedException();
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
    async startBillingPortal(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { companyId: true }
        });
        if (!user)
            throw new common_1.UnauthorizedException();
        await this.prisma.outboxEvent.create({
            data: {
                companyId: user.companyId,
                type: "billing.portal",
                payload: { userId }
            }
        });
        return { ok: true };
    }
    async login(dto) {
        this.logger.debug(`Login attempt for ${dto.email}@${dto.companyCode}`);
        try {
            this.logger.debug('Finding user...');
            const company = await this.prisma.company.findUnique({ where: { code: dto.companyCode } });
            if (!company)
                throw new common_1.UnauthorizedException("Invalid credentials");
            const found = await this.getUserWithPerms(company.id, dto.email);
            if (!found) {
                this.logger.warn(`Login failed: user not found for ${dto.email}`);
                throw new common_1.UnauthorizedException("Invalid credentials");
            }
            const { user, perms } = found;
            this.logger.debug(`User found: ${user.id}, status: ${user.status}`);
            if (user.status !== "active") {
                this.logger.warn(`Login failed: user ${user.id} is disabled`);
                throw new common_1.ForbiddenException("User disabled");
            }
            this.logger.debug('Verifying password...');
            const ok = await argon2_1.default.verify(user.passwordHash, dto.password);
            if (!ok) {
                this.logger.warn(`Login failed: password mismatch for ${user.id}`);
                throw new common_1.UnauthorizedException("Invalid credentials");
            }
            this.logger.debug('Checking TOTP...');
            let trustedDevice = null;
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
            if (user.totpEnabled && !trustedDevice?.trusted) {
                if (!dto.totpCode)
                    throw new common_1.UnauthorizedException("TOTP required");
                const encSecret = user.totpSecretEnc;
                if (!encSecret)
                    throw new common_1.UnauthorizedException("TOTP secret missing");
                const secret = (0, totp_crypto_1.decryptTotpSecret)(encSecret);
                const valid = speakeasy.totp.verify({
                    secret,
                    encoding: "base32",
                    token: dto.totpCode,
                    window: 1
                });
                if (!valid) {
                    this.logger.warn(`Login failed: invalid TOTP for ${user.id}`);
                    throw new common_1.UnauthorizedException("Invalid TOTP");
                }
            }
            let deviceId = trustedDevice?.id || null;
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
            }
            else if (trustedDevice?.id && dto.rememberDevice && !trustedDevice.trusted) {
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
            this.logger.log(`Login successful for user ${user.id}`);
            return { accessToken: access, refreshToken: refresh, userId: user.id, companyId: user.companyId, perms, deviceId };
        }
        catch (e) {
            this.logger.error(`Login error: ${e.message || e}`, e.stack);
            if (e instanceof common_1.UnauthorizedException || e instanceof common_1.ForbiddenException)
                throw e;
            throw new common_1.InternalServerErrorException(`Login failed: ${e.message || e}`);
        }
    }
    async refresh(dto) {
        try {
            const issuer = process.env.JWT_ISSUER;
            const audience = process.env.JWT_AUDIENCE;
            const verifyOptions = {};
            if (issuer)
                verifyOptions.issuer = issuer;
            if (audience)
                verifyOptions.audience = audience;
            const payload = this.jwt.verify(dto.refreshToken, verifyOptions);
            if (payload.typ !== "refresh")
                throw new common_1.UnauthorizedException("Invalid token");
            const session = await this.prisma.authSession.findFirst({
                where: {
                    userId: payload.sub,
                    refreshTokenHash: this.sha256(dto.refreshToken),
                    revokedAt: null
                }
            });
            if (!session)
                throw new common_1.UnauthorizedException("Invalid token");
            const found = await this.getUserWithPermsById(payload.sub);
            if (!found)
                throw new common_1.UnauthorizedException("Invalid token");
            const { user, perms } = found;
            if (user.companyId !== payload.companyId)
                throw new common_1.UnauthorizedException("Invalid token");
            if (payload.ver !== user.trustedDeviceVersion)
                throw new common_1.UnauthorizedException("Invalid token");
            if (user.status !== "active")
                throw new common_1.ForbiddenException("User disabled");
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
        }
        catch (e) {
            if (e instanceof common_1.UnauthorizedException || e instanceof common_1.ForbiddenException)
                throw e;
            throw new common_1.UnauthorizedException("Invalid token");
        }
    }
    async logout(refreshToken) {
        const tokenHash = this.sha256(refreshToken);
        await this.prisma.authSession.updateMany({
            where: { refreshTokenHash: tokenHash, revokedAt: null },
            data: { revokedAt: new Date() }
        });
        return { ok: true };
    }
    async totpSetup(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.UnauthorizedException();
        const secret = speakeasy.generateSecret({
            name: `Lekhaly (${user.email})`,
            length: 20
        });
        const encrypted = (0, totp_crypto_1.encryptTotpSecret)(secret.base32);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { totpSecretEnc: encrypted }
        });
        const qrDataUrl = await qrcode.toDataURL(secret.otpauth_url);
        return { base32: secret.base32, otpauthUrl: secret.otpauth_url, qrDataUrl };
    }
    async totpEnable(userId, code) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user?.totpSecretEnc)
            throw new common_1.ForbiddenException("Setup TOTP first");
        const decryptedSecret = (0, totp_crypto_1.decryptTotpSecret)(user.totpSecretEnc);
        const valid = speakeasy.totp.verify({
            secret: decryptedSecret,
            encoding: "base32",
            token: code,
            window: 1
        });
        if (!valid)
            throw new common_1.UnauthorizedException("Invalid code");
        const backupCodesPlain = Array.from({ length: 8 }).map(() => crypto_1.default.randomBytes(5).toString("hex"));
        await this.prisma.backupCode.createMany({
            data: backupCodesPlain.map(c => ({ userId: user.id, codeHash: this.sha256(c) }))
        });
        await this.prisma.user.update({ where: { id: user.id }, data: { totpEnabled: true } });
        return { enabled: true, backupCodes: backupCodesPlain };
    }
    async stepUp(userId, code) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user?.totpEnabled || !user.totpSecretEnc)
            throw new common_1.ForbiddenException("TOTP not enabled");
        const decryptedSecret = (0, totp_crypto_1.decryptTotpSecret)(user.totpSecretEnc);
        const valid = speakeasy.totp.verify({
            secret: decryptedSecret,
            encoding: "base32",
            token: code,
            window: 1
        });
        if (!valid)
            throw new common_1.UnauthorizedException("Invalid code");
        const found = await this.getUserWithPermsById(user.id);
        if (!found)
            throw new common_1.UnauthorizedException();
        const access = this.signAccessToken({
            sub: user.id,
            companyId: user.companyId,
            perms: found.perms,
            step: "sensitive",
            ver: user.trustedDeviceVersion
        });
        return { stepUpToken: access };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map