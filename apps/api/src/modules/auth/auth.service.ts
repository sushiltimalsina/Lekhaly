import { ForbiddenException, Injectable, UnauthorizedException, InternalServerErrorException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { JwtSignOptions } from "@nestjs/jwt";
import { PrismaService } from "../../common/prisma/prisma.service";
import argon2 from "argon2";
import * as speakeasy from "speakeasy";
import * as qrcode from "qrcode";
import crypto from "crypto";

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
  constructor(private prisma: PrismaService, private jwt: JwtService) { }

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

  async login(dto: {
    companyId: string;
    email: string;
    password: string;
    totpCode?: string;
    deviceId?: string;
    deviceLabel?: string;
    rememberDevice?: boolean;
  }) {
    console.log('LOGIN_START', { email: dto.email, companyId: dto.companyId });
    try {
      console.log('LOGIN_STEP: findUser');
      const found = await this.getUserWithPerms(dto.companyId, dto.email);
      if (!found) {
        console.log('LOGIN_FAILED: User not found');
        throw new UnauthorizedException("Invalid credentials");
      }

      const { user, perms } = found;
      console.log('LOGIN_STEP: userFound', { userId: user.id, status: user.status });

      if (user.status !== "active") {
        console.log('LOGIN_FAILED: User disabled');
        throw new ForbiddenException("User disabled");
      }

      console.log('LOGIN_STEP: verifyPassword');
      const ok = await argon2.verify(user.passwordHash, dto.password);
      if (!ok) {
        console.log('LOGIN_FAILED: Password mismatch');
        throw new UnauthorizedException("Invalid credentials");
      }

      console.log('LOGIN_STEP: totpCheck');
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
        const secret = user.totpSecretEnc; // for MVP store plain; later encrypt-at-rest
        if (!secret) throw new UnauthorizedException("TOTP secret missing");

        const valid = speakeasy.totp.verify({
          secret,
          encoding: "base32",
          token: dto.totpCode,
          window: 1
        });
        if (!valid) {
          console.log('LOGIN_FAILED: Invalid TOTP');
          throw new UnauthorizedException("Invalid TOTP");
        }
      }

      // Device registration (minimal)
      let deviceId: string | null = trustedDevice?.id || null;
      if (dto.deviceLabel) {
        console.log('LOGIN_STEP: deviceRegistration');
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

      console.log('LOGIN_STEP: signTokens');
      const access = this.signAccessToken({
        sub: user.id,
        companyId: user.companyId,
        perms,
        step: "none",
        ver: user.trustedDeviceVersion
      });

      const refresh = this.signRefreshToken(user.id, user.companyId, user.trustedDeviceVersion);

      console.log('LOGIN_STEP: createSession');
      await this.prisma.authSession.create({
        data: {
          userId: user.id,
          deviceId,
          refreshTokenHash: this.sha256(refresh),
          trustedUntil: dto.rememberDevice ? new Date(Date.now() + 30 * 24 * 3600 * 1000) : null
        }
      });

      console.log('LOGIN_STEP: updateLastLogin');
      await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

      console.log('LOGIN_SUCCESS');
      return { accessToken: access, refreshToken: refresh, userId: user.id, companyId: user.companyId, perms, deviceId };
    } catch (e: any) {
      console.error('LOGIN_ERROR_CAUGHT', e);
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

    // MVP: store base32 secret (later: encrypt using KMS/KeyVault)
    await this.prisma.user.update({
      where: { id: user.id },
      data: { totpSecretEnc: secret.base32 }
    });

    const qrDataUrl = await qrcode.toDataURL(secret.otpauth_url!);
    return { base32: secret.base32, otpauthUrl: secret.otpauth_url, qrDataUrl };
  }

  async totpEnable(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.totpSecretEnc) throw new ForbiddenException("Setup TOTP first");

    const valid = speakeasy.totp.verify({
      secret: user.totpSecretEnc,
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

    const valid = speakeasy.totp.verify({
      secret: user.totpSecretEnc,
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
