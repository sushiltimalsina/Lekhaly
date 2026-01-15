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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const argon2_1 = __importDefault(require("argon2"));
const speakeasy = __importStar(require("speakeasy"));
const qrcode = __importStar(require("qrcode"));
const crypto_1 = __importDefault(require("crypto"));
let AuthService = class AuthService {
    prisma;
    jwt;
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
    signAccessToken(payload) {
        return this.jwt.sign(payload, { expiresIn: "15m" });
    }
    signRefreshToken(userId, companyId, version) {
        return this.jwt.sign({ sub: userId, companyId, ver: version, typ: "refresh" }, { expiresIn: "30d" });
    }
    sha256(s) {
        return crypto_1.default.createHash("sha256").update(s).digest("hex");
    }
    async login(dto) {
        try {
            const found = await this.getUserWithPerms(dto.companyId, dto.email);
            if (!found)
                throw new common_1.UnauthorizedException("Invalid credentials");
            const { user, perms } = found;
            if (user.status !== "active")
                throw new common_1.ForbiddenException("User disabled");
            const ok = await argon2_1.default.verify(user.passwordHash, dto.password);
            if (!ok)
                throw new common_1.UnauthorizedException("Invalid credentials");
            if (user.totpEnabled) {
                if (!dto.totpCode)
                    throw new common_1.UnauthorizedException("TOTP required");
                const secret = user.totpSecretEnc;
                if (!secret)
                    throw new common_1.UnauthorizedException("TOTP secret missing");
                const valid = speakeasy.totp.verify({
                    secret,
                    encoding: "base32",
                    token: dto.totpCode,
                    window: 1
                });
                if (!valid)
                    throw new common_1.UnauthorizedException("Invalid TOTP");
            }
            let deviceId = null;
            if (dto.deviceLabel) {
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
            const access = this.signAccessToken({
                sub: user.id,
                companyId: user.companyId,
                perms,
                step: "none",
                ver: user.trustedDeviceVersion
            });
            const refresh = this.signRefreshToken(user.id, user.companyId, user.trustedDeviceVersion);
            await this.prisma.authSession.create({
                data: {
                    userId: user.id,
                    deviceId,
                    refreshTokenHash: this.sha256(refresh),
                    trustedUntil: dto.rememberDevice ? new Date(Date.now() + 30 * 24 * 3600 * 1000) : null
                }
            });
            await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
            return { accessToken: access, refreshToken: refresh, userId: user.id, companyId: user.companyId, perms };
        }
        catch (e) {
            console.error('LOGIN_ERROR', e);
            throw new common_1.InternalServerErrorException(`Login failed: ${e.message || e}`);
        }
    }
    async totpSetup(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.UnauthorizedException();
        const secret = speakeasy.generateSecret({
            name: `Lekhaly (${user.email})`,
            length: 20
        });
        await this.prisma.user.update({
            where: { id: user.id },
            data: { totpSecretEnc: secret.base32 }
        });
        const qrDataUrl = await qrcode.toDataURL(secret.otpauth_url);
        return { base32: secret.base32, otpauthUrl: secret.otpauth_url, qrDataUrl };
    }
    async totpEnable(userId, code) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user?.totpSecretEnc)
            throw new common_1.ForbiddenException("Setup TOTP first");
        const valid = speakeasy.totp.verify({
            secret: user.totpSecretEnc,
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
        const valid = speakeasy.totp.verify({
            secret: user.totpSecretEnc,
            encoding: "base32",
            token: code,
            window: 1
        });
        if (!valid)
            throw new common_1.UnauthorizedException("Invalid code");
        const access = this.signAccessToken({
            sub: user.id,
            companyId: user.companyId,
            perms: [],
            step: "sensitive",
            ver: user.trustedDeviceVersion
        });
        return { stepUpToken: access };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map