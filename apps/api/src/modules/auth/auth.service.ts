import { BadRequestException, ForbiddenException, Injectable, Logger, UnauthorizedException, InternalServerErrorException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { JwtSignOptions } from "@nestjs/jwt";
import { PrismaService } from "../../common/prisma/prisma.service";
import { Prisma } from "@prisma/client";
import { FiscalSessionsService } from "../fiscal-sessions/fiscal-sessions.service";
import { CoaSeederService } from "../accounts/coa-seeder.service";
import { ItemsSeederService } from "../items/items-seeder.service";
import argon2 from "argon2";
import * as speakeasy from "speakeasy";
import * as qrcode from "qrcode";
import crypto from "crypto";
import { encryptTotpSecret, decryptTotpSecret } from "../../common/auth/totp-crypto";
import { bsFiscalYearRangeFromStart } from "../../common/date/nepali-date";

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

type JwtLoginChallengePayload = {
  sub: string;
  companyId: string;
  ver: number;
  typ: "login_challenge";
};

type JwtTotpDisableChallengePayload = {
  sub: string;
  companyId: string;
  ver: number;
  typ: "totp_disable_challenge";
};

type JwtTotpRecoveryChallengePayload = {
  sub: string;
  companyId: string;
  ver: number;
  typ: "totp_recovery_challenge";
};

type GoogleAuthIntent = "login" | "register";

type GoogleAuthStatePayload = {
  typ: "google_oauth_state";
  intent: GoogleAuthIntent;
  clientOrigin: string;
  companyName?: string;
  name?: string;
  deviceId?: string;
};

type GoogleUserInfo = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
};

type ExternalOAuthUser = {
  subject: string;
  email: string;
  emailVerified: boolean;
  name?: string;
};

type UserWithRolePermissions = Prisma.UserGetPayload<{
  include: { userRoles: { include: { role: { include: { rolePermissions: true } } } } };
}>;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private fiscalSessions: FiscalSessionsService,
    private coaSeeder: CoaSeederService,
    private itemsSeeder: ItemsSeederService
  ) { }

  private async getUserWithPerms(email: string, companyId?: string) {
    const users = await this.prisma.user.findMany({
      where: {
        email: { equals: email, mode: "insensitive" },
        ...(companyId ? { companyId } : {})
      },
      include: { userRoles: { include: { role: { include: { rolePermissions: true } } } } },
      take: 2
    });
    if (users.length !== 1) return null;
    const user = users[0];

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
    const signOptions: JwtSignOptions = { expiresIn: 1800 };
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

  private signLoginChallenge(userId: string, companyId: string, version: number) {
    const issuer = process.env.JWT_ISSUER;
    const audience = process.env.JWT_AUDIENCE;
    const signOptions: JwtSignOptions = { expiresIn: 300 };
    if (issuer) signOptions.issuer = issuer;
    if (audience) signOptions.audience = audience;
    return this.jwt.sign({ sub: userId, companyId, ver: version, typ: "login_challenge" }, signOptions);
  }

  private signTotpDisableChallenge(userId: string, companyId: string, version: number) {
    const issuer = process.env.JWT_ISSUER;
    const audience = process.env.JWT_AUDIENCE;
    const signOptions: JwtSignOptions = { expiresIn: 300 };
    if (issuer) signOptions.issuer = issuer;
    if (audience) signOptions.audience = audience;
    return this.jwt.sign({ sub: userId, companyId, ver: version, typ: "totp_disable_challenge" }, signOptions);
  }

  private signTotpRecoveryChallenge(userId: string, companyId: string, version: number) {
    const issuer = process.env.JWT_ISSUER;
    const audience = process.env.JWT_AUDIENCE;
    const signOptions: JwtSignOptions = { expiresIn: 300 };
    if (issuer) signOptions.issuer = issuer;
    if (audience) signOptions.audience = audience;
    return this.jwt.sign({ sub: userId, companyId, ver: version, typ: "totp_recovery_challenge" }, signOptions);
  }

  private getGoogleConfig() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    if (!clientId || !clientSecret || !redirectUri) {
      throw new InternalServerErrorException("Google OAuth is not configured");
    }
    return { clientId, clientSecret, redirectUri };
  }

  private getAllowedGoogleClientOrigins() {
    const configured = process.env.GOOGLE_OAUTH_ALLOWED_ORIGINS || process.env.CORS_ORIGINS;
    return (configured
      ? configured.split(",")
      : ["http://localhost:3000", "http://localhost:1420", "http://localhost:1430", "http://127.0.0.1:1430"])
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  private validateGoogleClientOrigin(value: string) {
    let origin: string;
    try {
      origin = new URL(value).origin;
    } catch {
      throw new UnauthorizedException("Invalid OAuth client origin");
    }
    if (!this.getAllowedGoogleClientOrigins().includes(origin)) {
      throw new UnauthorizedException("OAuth client origin is not allowed");
    }
    return origin;
  }

  private async verifyGoogleState(state: string) {
    try {
      const issuer = process.env.JWT_ISSUER;
      const audience = process.env.JWT_AUDIENCE;
      const verifyOptions: { issuer?: string; audience?: string } = {};
      if (issuer) verifyOptions.issuer = issuer;
      if (audience) verifyOptions.audience = audience;
      const payload = await this.jwt.verifyAsync<GoogleAuthStatePayload>(state, verifyOptions);
      if (payload.typ !== "google_oauth_state") throw new UnauthorizedException("Invalid Google OAuth state");
      const clientOrigin = this.validateGoogleClientOrigin(payload.clientOrigin);
      if (payload.intent === "register" && (!payload.companyName || !payload.name)) {
        throw new UnauthorizedException("Invalid Google registration state");
      }
      return { ...payload, clientOrigin };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException("Invalid or expired Google OAuth state");
    }
  }

  async getGoogleAuthorizationUrl(dto: {
    intent: GoogleAuthIntent;
    clientOrigin: string;
    companyName?: string;
    name?: string;
    deviceId?: string;
  }) {
    const { clientId, redirectUri } = this.getGoogleConfig();
    const clientOrigin = this.validateGoogleClientOrigin(dto.clientOrigin);
    if (dto.intent === "register" && (!dto.companyName || !dto.name)) {
      throw new ForbiddenException("Company name and owner name are required for Google registration");
    }

    const signOptions: JwtSignOptions = { expiresIn: 600 };
    if (process.env.JWT_ISSUER) signOptions.issuer = process.env.JWT_ISSUER;
    if (process.env.JWT_AUDIENCE) signOptions.audience = process.env.JWT_AUDIENCE;
    const state = this.jwt.sign({
      typ: "google_oauth_state",
      intent: dto.intent,
      clientOrigin,
      companyName: dto.companyName,
      name: dto.name,
      deviceId: dto.deviceId
    }, signOptions);

    const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authorizationUrl.searchParams.set("client_id", clientId);
    authorizationUrl.searchParams.set("redirect_uri", redirectUri);
    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("scope", "openid email profile");
    authorizationUrl.searchParams.set("state", state);
    authorizationUrl.searchParams.set("prompt", "select_account");
    return authorizationUrl.toString();
  }

  private async getGoogleUser(code: string) {
    const { clientId, clientSecret, redirectUri } = this.getGoogleConfig();
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    });
    if (!tokenResponse.ok) throw new UnauthorizedException("Google authorization could not be completed");
    const token = await tokenResponse.json() as { access_token?: string };
    if (!token.access_token) throw new UnauthorizedException("Google authorization could not be completed");

    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${token.access_token}` }
    });
    if (!profileResponse.ok) throw new UnauthorizedException("Google profile could not be verified");
    const profile = await profileResponse.json() as GoogleUserInfo;
    if (!profile.sub || !profile.email || profile.email_verified !== true) {
      throw new UnauthorizedException("A verified Google email address is required");
    }
    return { subject: profile.sub, email: profile.email.toLowerCase(), name: profile.name };
  }

  private createExternalOAuthState(dto: {
    intent: GoogleAuthIntent;
    clientOrigin: string;
    companyName?: string;
    name?: string;
    deviceId?: string;
  }) {
    const clientOrigin = this.validateGoogleClientOrigin(dto.clientOrigin);
    if (dto.intent === "register" && (!dto.companyName || !dto.name)) {
      throw new ForbiddenException("Company name and owner name are required for OAuth registration");
    }

    const signOptions: JwtSignOptions = { expiresIn: 600 };
    if (process.env.JWT_ISSUER) signOptions.issuer = process.env.JWT_ISSUER;
    if (process.env.JWT_AUDIENCE) signOptions.audience = process.env.JWT_AUDIENCE;
    return this.jwt.sign({
      typ: "google_oauth_state",
      intent: dto.intent,
      clientOrigin,
      companyName: dto.companyName,
      name: dto.name,
      deviceId: dto.deviceId
    }, signOptions);
  }

  async getLinkedInAuthorizationUrl(dto: {
    intent: GoogleAuthIntent;
    clientOrigin: string;
    companyName?: string;
    name?: string;
    deviceId?: string;
  }) {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
    if (!clientId || !process.env.LINKEDIN_CLIENT_SECRET || !redirectUri) {
      throw new InternalServerErrorException("LinkedIn OAuth is not configured");
    }

    const url = new URL("https://www.linkedin.com/oauth/v2/authorization");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid profile email");
    url.searchParams.set("state", this.createExternalOAuthState(dto));
    return url.toString();
  }

  async getMicrosoftAuthorizationUrl(dto: {
    intent: GoogleAuthIntent;
    clientOrigin: string;
    companyName?: string;
    name?: string;
    deviceId?: string;
  }) {
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const redirectUri = process.env.MICROSOFT_REDIRECT_URI;
    if (!clientId || !process.env.MICROSOFT_CLIENT_SECRET || !redirectUri) {
      throw new InternalServerErrorException("Microsoft OAuth is not configured");
    }

    const tenant = process.env.MICROSOFT_TENANT_ID || "common";
    const url = new URL(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`);
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("response_mode", "query");
    url.searchParams.set("scope", "openid profile email");
    url.searchParams.set("state", this.createExternalOAuthState(dto));
    return url.toString();
  }

  private async getExternalOAuthUser(provider: "linkedin" | "microsoft", code: string): Promise<ExternalOAuthUser> {
    const isLinkedIn = provider === "linkedin";
    const prefix = isLinkedIn ? "LINKEDIN" : "MICROSOFT";
    const clientId = process.env[`${prefix}_CLIENT_ID`];
    const clientSecret = process.env[`${prefix}_CLIENT_SECRET`];
    const redirectUri = process.env[`${prefix}_REDIRECT_URI`];
    if (!clientId || !clientSecret || !redirectUri) {
      throw new InternalServerErrorException(`${isLinkedIn ? "LinkedIn" : "Microsoft"} OAuth is not configured`);
    }

    const tokenUrl = isLinkedIn
      ? "https://www.linkedin.com/oauth/v2/accessToken"
      : `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID || "common"}/oauth2/v2.0/token`;
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    });
    if (!tokenResponse.ok) throw new UnauthorizedException(`${isLinkedIn ? "LinkedIn" : "Microsoft"} authorization could not be completed`);
    const token = await tokenResponse.json() as { access_token?: string };
    if (!token.access_token) throw new UnauthorizedException(`${isLinkedIn ? "LinkedIn" : "Microsoft"} authorization could not be completed`);

    const profileResponse = await fetch(isLinkedIn
      ? "https://api.linkedin.com/v2/userinfo"
      : "https://graph.microsoft.com/oidc/userinfo", {
      headers: { Authorization: `Bearer ${token.access_token}` }
    });
    if (!profileResponse.ok) throw new UnauthorizedException(`${isLinkedIn ? "LinkedIn" : "Microsoft"} profile could not be verified`);
    const profile = await profileResponse.json() as GoogleUserInfo;
    if (!profile.sub || !profile.email || (isLinkedIn && profile.email_verified !== true)) {
      throw new UnauthorizedException("A verified email address is required");
    }
    return {
      subject: profile.sub,
      email: profile.email.toLowerCase(),
      emailVerified: profile.email_verified === true,
      name: profile.name
    };
  }

  private async completeExternalOAuthAuthorization(
    provider: "linkedin" | "microsoft",
    dto: { code?: string; state: string; error?: string }
  ) {
    const state = await this.verifyGoogleState(dto.state);
    if (dto.error || !dto.code) throw new UnauthorizedException(`${provider === "linkedin" ? "LinkedIn" : "Microsoft"} sign-in was cancelled or denied`);
    const externalUser = await this.getExternalOAuthUser(provider, dto.code);
    const subjectField = provider === "linkedin" ? "linkedinSubject" : "microsoftSubject";
    const include = { userRoles: { include: { role: { include: { rolePermissions: true } } } } };
    let found: UserWithRolePermissions | null = await this.prisma.user.findUnique({
      where: { [subjectField]: externalUser.subject } as any,
      include
    });

    if (!found && state.intent === "login" && externalUser.emailVerified) {
      const existing = await this.getUserWithPerms(externalUser.email);
      if (existing) {
        try {
          await this.prisma.user.update({
            where: { id: existing.user.id },
            data: { [subjectField]: externalUser.subject } as any
          });
          found = existing.user as UserWithRolePermissions;
        } catch (error) {
          if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
          found = await this.prisma.user.findUnique({ where: { [subjectField]: externalUser.subject } as any, include });
        }
      }
    }

    if (!found && state.intent === "register") {
      const registered = await this.register({
        companyName: state.companyName!,
        name: state.name!,
        email: externalUser.email,
        password: crypto.randomBytes(48).toString("base64url"),
        ...(provider === "linkedin" ? { linkedinSubject: externalUser.subject } : { microsoftSubject: externalUser.subject })
      });
      found = await this.prisma.user.findUnique({ where: { id: registered.userId }, include });
    }

    if (!found) throw new UnauthorizedException(`No account exists for this ${provider === "linkedin" ? "LinkedIn" : "Microsoft"} identity`);
    const permissions = new Set<string>();
    for (const userRole of found.userRoles) {
      for (const permission of userRole.role.rolePermissions) permissions.add(permission.permissionCode);
    }
    const result = await this.createGoogleLoginResult({ user: found, perms: Array.from(permissions) }, state.deviceId);
    return this.buildGoogleCallbackUrl(state.clientOrigin, result);
  }

  async completeLinkedInAuthorization(dto: { code?: string; state: string; error?: string }) {
    return this.completeExternalOAuthAuthorization("linkedin", dto);
  }

  async completeMicrosoftAuthorization(dto: { code?: string; state: string; error?: string }) {
    return this.completeExternalOAuthAuthorization("microsoft", dto);
  }

  async getLinkedInFailureRedirect(stateValue: string | undefined, error: unknown) {
    return this.getGoogleFailureRedirect(stateValue, error);
  }

  async getMicrosoftFailureRedirect(stateValue: string | undefined, error: unknown) {
    return this.getGoogleFailureRedirect(stateValue, error);
  }

  private async getTrustedDeviceId(user: { id: string; companyId: string }, deviceId?: string) {
    if (!deviceId) return null;
    const link = await this.prisma.deviceUserLink.findFirst({
      where: { deviceId, userId: user.id },
      include: { device: true }
    });
    if (!link?.device || link.device.companyId !== user.companyId) return null;

    const trustedSession = await this.prisma.authSession.findFirst({
      where: {
        userId: user.id,
        deviceId: link.device.id,
        trustedUntil: { gt: new Date() }
      },
      select: { id: true }
    });
    await this.prisma.device.update({
      where: { id: link.device.id },
      data: { lastSeenAt: new Date() }
    });
    return trustedSession && link.device.trusted ? link.device.id : null;
  }

  private async createGoogleLoginResult(
    found: NonNullable<Awaited<ReturnType<AuthService["getUserWithPermsById"]>>>,
    deviceId?: string
  ) {
    const { user, perms } = found;
    if (user.status !== "active") throw new ForbiddenException("User disabled");
    const trustedDeviceId = await this.getTrustedDeviceId(user, deviceId);
    if (user.totpEnabled && !trustedDeviceId) {
      return {
        requiresTotp: true,
        challengeToken: this.signLoginChallenge(user.id, user.companyId, user.trustedDeviceVersion)
      };
    }
    return this.createLoginSession(user, perms, trustedDeviceId);
  }

  private buildGoogleCallbackUrl(clientOrigin: string, result: { accessToken?: string; refreshToken?: string; challengeToken?: string }) {
    const url = new URL("/google/callback", clientOrigin);
    const fragment = new URLSearchParams();
    if (result.accessToken) fragment.set("access_token", result.accessToken);
    if (result.refreshToken) fragment.set("refresh_token", result.refreshToken);
    if (result.challengeToken) fragment.set("challenge_token", result.challengeToken);
    url.hash = fragment.toString();
    return url.toString();
  }

  async completeGoogleAuthorization(dto: { code?: string; state: string; error?: string }) {
    const state = await this.verifyGoogleState(dto.state);
    if (dto.error || !dto.code) throw new UnauthorizedException("Google sign-in was cancelled or denied");
    const googleUser = await this.getGoogleUser(dto.code);

    let found: UserWithRolePermissions | null = await this.prisma.user.findUnique({
      where: { googleSubject: googleUser.subject } as any,
      include: { userRoles: { include: { role: { include: { rolePermissions: true } } } } }
    });

    if (!found && state.intent === "login") {
      const existing = await this.getUserWithPerms(googleUser.email);
      if (existing) {
        try {
          await this.prisma.user.update({ where: { id: existing.user.id }, data: { googleSubject: googleUser.subject } as any });
          found = existing.user as UserWithRolePermissions;
        } catch (error) {
          if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
          found = await this.prisma.user.findUnique({
            where: { googleSubject: googleUser.subject } as any,
            include: { userRoles: { include: { role: { include: { rolePermissions: true } } } } }
          });
        }
      }
    }

    if (!found && state.intent === "register") {
      const registered = await this.register({
        companyName: state.companyName!,
        name: state.name!,
        email: googleUser.email,
        password: crypto.randomBytes(48).toString("base64url"),
        googleSubject: googleUser.subject
      });
      found = await this.prisma.user.findUnique({
        where: { id: registered.userId },
        include: { userRoles: { include: { role: { include: { rolePermissions: true } } } } }
      });
    }

    if (!found) throw new UnauthorizedException("No account exists for this Google identity");
    const perms = new Set<string>();
    for (const userRole of found.userRoles) {
      for (const permission of userRole.role.rolePermissions) perms.add(permission.permissionCode);
    }
    const result = await this.createGoogleLoginResult({ user: found, perms: Array.from(perms) }, state.deviceId);
    return this.buildGoogleCallbackUrl(state.clientOrigin, result);
  }

  async getGoogleFailureRedirect(stateValue: string | undefined, error: unknown) {
    if (!stateValue) return null;
    try {
      const state = await this.verifyGoogleState(stateValue);
      const url = new URL(state.intent === "register" ? "/register" : "/login", state.clientOrigin);
      const message = error instanceof Error ? error.message : "Google sign-in failed";
      url.searchParams.set("google_error", message);
      return url.toString();
    } catch {
      return null;
    }
  }

  private async createLoginSession(
    user: { id: string; companyId: string; trustedDeviceVersion: number },
    perms: string[],
    deviceId: string | null = null,
    rememberDevice = false
  ) {
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
        trustedUntil: rememberDevice ? new Date(Date.now() + 30 * 24 * 3600 * 1000) : null
      }
    });
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await this.fiscalSessions.initActiveSession(user.companyId);

    return {
      accessToken: access,
      refreshToken: refresh,
      userId: user.id,
      companyId: user.companyId,
      perms,
      deviceId: rememberDevice ? deviceId : null
    };
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
    // Create default NFRS-compliant Chart of Accounts
    const coa = await this.coaSeeder.seedNfrs(tx, companyId);
    const {
      vatReceivable,
      vatPayable,
      discountGiven,
      sales,
    } = coa;

    // Create default Tax Codes
    const vat13 = await tx.taxCode.create({
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

    // Seed default items, units, payment methods, and sale types
    await this.itemsSeeder.seedDefaults(tx, companyId, coa, vat13.id);

    return coa;
  }

  async requestPasswordReset(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
      select: { id: true, email: true }
    });

    if (!user) {
      return { ok: true, message: "If an account exists for that email, a reset link has been prepared." };
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash: this.sha256(token),
        passwordResetTokenExpiresAt: expiresAt
      }
    });

    const exposeToken = process.env.NODE_ENV !== "production" || process.env.ALLOW_RESET_TOKEN_RESPONSE === "true";
    return {
      ok: true,
      message: "If an account exists for that email, a reset link has been prepared.",
      ...(exposeToken ? { resetToken: token } : {}),
      resetUrl: exposeToken ? `${process.env.PUBLIC_APP_URL ?? "http://localhost:3000"}/reset-password?token=${encodeURIComponent(token)}` : undefined
    };
  }

  async resetPassword(dto: { token: string; password: string }) {
    const token = dto.token?.trim();
    if (!token) throw new UnauthorizedException("Invalid or expired reset token");

    const users = await this.prisma.user.findMany({
      where: {
        passwordResetTokenHash: { not: null },
        passwordResetTokenExpiresAt: { gt: new Date() }
      },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        passwordResetTokenHash: true,
        passwordResetTokenExpiresAt: true
      }
    });

    const match = users.find((user) => user.passwordResetTokenHash === this.sha256(token));
    if (!match) throw new UnauthorizedException("Invalid or expired reset token");

    const passwordHash = await argon2.hash(dto.password);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: match.id },
        data: {
          passwordHash,
          passwordResetTokenHash: null,
          passwordResetTokenExpiresAt: null
        }
      });

      await tx.authSession.updateMany({
        where: { userId: match.id, revokedAt: null },
        data: { revokedAt: new Date() }
      });
    });

    return { ok: true, message: "Password updated successfully. Please sign in again." };
  }

  async register(dto: {
    companyName: string;
    name: string;
    email: string;
    password: string;
    googleSubject?: string;
    linkedinSubject?: string;
    microsoftSubject?: string;
  }) {
    const passwordHash = await argon2.hash(dto.password);
    const companyCode = `LK-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const existingUser = await tx.user.findFirst({
          where: { email: { equals: dto.email, mode: "insensitive" } },
          select: { id: true }
        });
        if (existingUser) throw new ForbiddenException("Email already in use");

        const permAll = await this.ensurePermissions(tx);

        const company = await tx.company.create({
          data: {
            code: companyCode,
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
            nextInvoiceNumber: 1,
            onboardingCompleted: false,
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
            passwordHash,
            googleSubject: dto.googleSubject,
            linkedinSubject: dto.linkedinSubject,
            microsoftSubject: dto.microsoftSubject
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
        mobileNumber: true,
        email: true,
        ownerName: true,
        panNumber: true,
        vatNumber: true,
        panVatNumber: true,
        companyRegistrationNumber: true,
        localRegistrationNumber: true,
        dftqcNumber: true,
        tole: true,
        province: true,
        district: true,
        localLevel: true,
        ward: true,
        onboardingCompleted: true,
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
    address?: string | null;
    phone?: string | null;
    mobileNumber?: string | null;
    email?: string | null;
    ownerName?: string | null;
    panNumber?: string;
    vatNumber?: string;
    panVatNumber?: string | null;
    companyRegistrationNumber?: string | null;
    localRegistrationNumber?: string | null;
    dftqcNumber?: string | null;
    tole?: string | null;
    province?: string | null;
    district?: string | null;
    localLevel?: string | null;
    ward?: number | null;
  }, markOnboardingComplete = false) {
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
        mobileNumber: dto.mobileNumber !== undefined ? dto.mobileNumber : undefined,
        email: dto.email !== undefined ? dto.email : undefined,
        ownerName: dto.ownerName !== undefined ? dto.ownerName : undefined,
        panNumber: dto.panNumber ?? undefined,
        vatNumber: dto.vatNumber ?? undefined,
        panVatNumber: dto.panVatNumber !== undefined ? dto.panVatNumber : undefined,
        companyRegistrationNumber: dto.companyRegistrationNumber !== undefined ? dto.companyRegistrationNumber : undefined,
        localRegistrationNumber: dto.localRegistrationNumber !== undefined ? dto.localRegistrationNumber : undefined,
        dftqcNumber: dto.dftqcNumber !== undefined ? dto.dftqcNumber : undefined,
        tole: dto.tole !== undefined ? dto.tole : undefined,
        province: dto.province !== undefined ? dto.province : undefined,
        district: dto.district !== undefined ? dto.district : undefined,
        localLevel: dto.localLevel !== undefined ? dto.localLevel : undefined,
        ward: dto.ward !== undefined ? dto.ward : undefined,
        onboardingCompleted: markOnboardingComplete ? true : undefined,
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
        mobileNumber: true,
        email: true,
        ownerName: true,
        panNumber: true,
        vatNumber: true,
        panVatNumber: true,
        companyRegistrationNumber: true,
        localRegistrationNumber: true,
        dftqcNumber: true,
        tole: true,
        province: true,
        district: true,
        localLevel: true,
        ward: true,
        onboardingCompleted: true,
      } as any
    });
  }

  async completeCompanyOnboarding(userId: string, dto: {
    name?: string;
    email?: string | null;
    ownerName?: string | null;
    province?: string | null;
    district?: string | null;
    localLevel?: string | null;
    ward?: number | null;
    fiscalYearStartMonth?: number;
    fiscalYearStartDateBs?: string;
    [key: string]: unknown;
  }) {
    const requiredFields = [dto.name, dto.email, dto.ownerName, dto.province, dto.district, dto.localLevel];
    if (requiredFields.some((value) => typeof value !== "string" || value.trim().length === 0) || !Number.isInteger(dto.ward) || (dto.ward ?? 0) < 1 || !dto.fiscalYearStartDateBs) {
      throw new BadRequestException("Company details, address, and fiscal-year start date are required");
    }

    const fiscalYearStartMonth = Number(dto.fiscalYearStartDateBs.slice(5, 7));
    if (!Number.isInteger(dto.fiscalYearStartMonth) || dto.fiscalYearStartMonth !== fiscalYearStartMonth) {
      throw new BadRequestException("Fiscal-year start month must match the selected start date");
    }

    const fiscalYear = bsFiscalYearRangeFromStart(dto.fiscalYearStartDateBs);
    const { startDate, endDate, endDateBs } = fiscalYear;

    const startYear = dto.fiscalYearStartDateBs.slice(0, 4);
    const endYear = endDateBs.slice(0, 4);
    const invoiceSuffix = `${startYear.slice(-2)}/${endYear.slice(-2)}`;
    const sessionName = `Year ${startYear}/${endYear.slice(-2)}`;
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { companyId: true } });
    if (!user) throw new UnauthorizedException();

    await this.updateCompany(userId, { ...dto, fiscalYearStartMonth, invoiceSuffix }, false);
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.fiscalSession.findUnique({
        where: { companyId_name: { companyId: user.companyId, name: sessionName } },
        select: { id: true, startDate: true, endDate: true }
      });
      if (existing && (existing.startDate.getTime() !== startDate.getTime() || existing.endDate.getTime() !== endDate.getTime())) {
        throw new BadRequestException("A different fiscal session already exists with this year name");
      }

      const session = existing
        ? await tx.fiscalSession.update({ where: { id: existing.id }, data: { invoiceSuffix }, select: { id: true } })
        : await tx.fiscalSession.create({
            data: { companyId: user.companyId, name: sessionName, startDate, endDate, invoiceSuffix },
            select: { id: true }
          });

      await tx.company.update({
        where: { id: user.companyId },
        data: { activeFiscalSessionId: session.id, onboardingCompleted: true }
      });
    });

    return this.getCompany(userId);
  }

  async logoutAll(userId: string) {
    await this.prisma.authSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
    await this.prisma.authSession.updateMany({
      where: { userId, trustedUntil: { not: null } },
      data: { trustedUntil: null }
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
    companyCode?: string;
    email: string;
    password: string;
    deviceId?: string;
  }) {
    this.logger.debug(`Login attempt for ${dto.email}`);
    try {
      this.logger.debug('Finding user...');
      const company = dto.companyCode
        ? await this.prisma.company.findUnique({
            where: { code: dto.companyCode },
            select: { id: true }
          })
        : null;
      if (dto.companyCode && !company) throw new UnauthorizedException("Invalid credentials");
      const found = await this.getUserWithPerms(dto.email, company?.id);
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

      const trustedDeviceId = await this.getTrustedDeviceId(user, dto.deviceId);

      if (user.totpEnabled && !trustedDeviceId) {
        return {
          requiresTotp: true,
          challengeToken: this.signLoginChallenge(user.id, user.companyId, user.trustedDeviceVersion)
        };
      }

      const session = await this.createLoginSession(user, perms, trustedDeviceId);
      this.logger.log(`Login successful for user ${user.id}`);
      return session;
    } catch (e: any) {
      this.logger.error(`Login error: ${e.message || e}`, e.stack);
      if (e instanceof UnauthorizedException || e instanceof ForbiddenException) throw e;
      throw new InternalServerErrorException(`Login failed: ${e.message || e}`);
    }
  }

  async loginTotp(dto: {
    challengeToken: string;
    code: string;
    deviceId?: string;
    rememberDevice?: boolean;
  }) {
    try {
      const issuer = process.env.JWT_ISSUER;
      const audience = process.env.JWT_AUDIENCE;
      const verifyOptions: { issuer?: string; audience?: string } = {};
      if (issuer) verifyOptions.issuer = issuer;
      if (audience) verifyOptions.audience = audience;
      const challenge = await this.jwt.verifyAsync<JwtLoginChallengePayload>(dto.challengeToken, verifyOptions);
      if (challenge.typ !== "login_challenge") throw new UnauthorizedException("Invalid login challenge");

      const user = await this.prisma.user.findUnique({ where: { id: challenge.sub } });
      if (!user || user.companyId !== challenge.companyId || user.trustedDeviceVersion !== challenge.ver) {
        throw new UnauthorizedException("Invalid login challenge");
      }
      if (user.status !== "active") throw new ForbiddenException("User disabled");
      if (!user.totpEnabled || !user.totpSecretEnc) throw new UnauthorizedException("TOTP is not enabled");

      const validTotp = /^\d{6}$/.test(dto.code) && speakeasy.totp.verify({
        secret: decryptTotpSecret(user.totpSecretEnc),
        encoding: "base32",
        token: dto.code,
        window: 1
      });
      if (!validTotp) {
        const backupCode = await this.prisma.backupCode.findFirst({
          where: { userId: user.id, codeHash: this.sha256(dto.code.toLowerCase()), usedAt: null },
          select: { id: true }
        });
        if (!backupCode) throw new UnauthorizedException("Invalid authenticator or recovery code");

        const consumed = await this.prisma.backupCode.updateMany({
          where: { id: backupCode.id, usedAt: null },
          data: { usedAt: new Date() }
        });
        if (consumed.count !== 1) throw new UnauthorizedException("Recovery code already used");
      }

      let deviceId: string | null = null;
      if (dto.deviceId) {
        const link = await this.prisma.deviceUserLink.findFirst({
          where: { deviceId: dto.deviceId, userId: user.id },
          include: { device: true }
        });
        if (link?.device?.companyId === user.companyId) deviceId = link.device.id;
      }

      if (dto.rememberDevice) {
        if (!deviceId) {
          const device = await this.prisma.device.create({
            data: {
              companyId: user.companyId,
              label: "Remembered device",
              platform: "web",
              trusted: true
            }
          });
          await this.prisma.deviceUserLink.create({ data: { deviceId: device.id, userId: user.id } });
          deviceId = device.id;
        } else {
          await this.prisma.device.update({ where: { id: deviceId }, data: { trusted: true } });
        }
      } else if (deviceId) {
        await this.prisma.authSession.updateMany({
          where: { userId: user.id, deviceId, trustedUntil: { not: null } },
          data: { trustedUntil: null }
        });
        await this.prisma.device.update({ where: { id: deviceId }, data: { trusted: false } });
        deviceId = null;
      }

      const found = await this.getUserWithPermsById(user.id);
      if (!found) throw new UnauthorizedException("Invalid login challenge");
      return this.createLoginSession(found.user, found.perms, deviceId, Boolean(dto.rememberDevice));
    } catch (e: any) {
      if (e instanceof UnauthorizedException || e instanceof ForbiddenException) throw e;
      throw new UnauthorizedException("Invalid login challenge");
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

  async totpStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { totpEnabled: true }
    });
    if (!user) throw new UnauthorizedException();
    const recoveryCodesRemaining = user.totpEnabled
      ? await this.prisma.backupCode.count({ where: { userId, usedAt: null } })
      : 0;
    return { enabled: user.totpEnabled, recoveryCodesRemaining };
  }

  async totpSetup(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    if (user.totpEnabled) throw new ForbiddenException("TOTP is already enabled");

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
    if (user.totpEnabled) throw new ForbiddenException("TOTP is already enabled");

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
    await this.prisma.$transaction(async (tx) => {
      await tx.backupCode.createMany({
        data: backupCodesPlain.map(c => ({ userId: user.id, codeHash: this.sha256(c) }))
      });
      await tx.user.update({ where: { id: user.id }, data: { totpEnabled: true } });
    });

    return { enabled: true, backupCodes: backupCodesPlain };
  }

  async verifyTotpRecoveryPassword(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.totpEnabled || !user.totpSecretEnc) {
      throw new ForbiddenException("TOTP is not enabled");
    }
    if (!(await argon2.verify(user.passwordHash, password))) {
      throw new UnauthorizedException("Invalid password");
    }

    return {
      challengeToken: this.signTotpRecoveryChallenge(user.id, user.companyId, user.trustedDeviceVersion)
    };
  }

  async regenerateTotpRecoveryCodes(userId: string, dto: { challengeToken: string; code: string }) {
    const issuer = process.env.JWT_ISSUER;
    const audience = process.env.JWT_AUDIENCE;
    const verifyOptions: { issuer?: string; audience?: string } = {};
    if (issuer) verifyOptions.issuer = issuer;
    if (audience) verifyOptions.audience = audience;
    let challenge: JwtTotpRecoveryChallengePayload;
    try {
      challenge = await this.jwt.verifyAsync<JwtTotpRecoveryChallengePayload>(dto.challengeToken, verifyOptions);
    } catch {
      throw new UnauthorizedException("Password confirmation expired");
    }
    if (challenge.typ !== "totp_recovery_challenge" || challenge.sub !== userId) {
      throw new UnauthorizedException("Invalid password confirmation");
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (
      !user?.totpEnabled ||
      !user.totpSecretEnc ||
      user.companyId !== challenge.companyId ||
      user.trustedDeviceVersion !== challenge.ver
    ) {
      throw new UnauthorizedException("Password confirmation expired");
    }

    const valid = speakeasy.totp.verify({
      secret: decryptTotpSecret(user.totpSecretEnc),
      encoding: "base32",
      token: dto.code,
      window: 1
    });
    if (!valid) throw new UnauthorizedException("Invalid authenticator code");

    const backupCodesPlain = Array.from({ length: 8 }, () => crypto.randomBytes(5).toString("hex"));
    await this.prisma.$transaction(async (tx) => {
      await tx.backupCode.deleteMany({ where: { userId: user.id } });
      await tx.backupCode.createMany({
        data: backupCodesPlain.map((code) => ({ userId: user.id, codeHash: this.sha256(code) }))
      });
    });

    return { backupCodes: backupCodesPlain, recoveryCodesRemaining: backupCodesPlain.length };
  }

  async verifyTotpDisablePassword(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.totpEnabled || !user.totpSecretEnc) {
      throw new ForbiddenException("TOTP is not enabled");
    }

    if (!(await argon2.verify(user.passwordHash, password))) {
      throw new UnauthorizedException("Invalid password");
    }

    return {
      challengeToken: this.signTotpDisableChallenge(user.id, user.companyId, user.trustedDeviceVersion)
    };
  }

  async totpDisable(
    userId: string,
    dto: { challengeToken: string; method: "authenticator" | "recovery"; code: string }
  ) {
    const issuer = process.env.JWT_ISSUER;
    const audience = process.env.JWT_AUDIENCE;
    const verifyOptions: { issuer?: string; audience?: string } = {};
    if (issuer) verifyOptions.issuer = issuer;
    if (audience) verifyOptions.audience = audience;
    let challenge: JwtTotpDisableChallengePayload;
    try {
      challenge = await this.jwt.verifyAsync<JwtTotpDisableChallengePayload>(dto.challengeToken, verifyOptions);
    } catch {
      throw new UnauthorizedException("Password confirmation expired");
    }
    if (challenge.typ !== "totp_disable_challenge" || challenge.sub !== userId) {
      throw new UnauthorizedException("Invalid password confirmation");
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (
      !user ||
      !user.totpEnabled ||
      !user.totpSecretEnc ||
      user.companyId !== challenge.companyId ||
      user.trustedDeviceVersion !== challenge.ver
    ) {
      throw new UnauthorizedException("Password confirmation expired");
    }

    const validTotp = dto.method === "authenticator" && /^\d{6}$/.test(dto.code) && speakeasy.totp.verify({
      secret: decryptTotpSecret(user.totpSecretEnc),
      encoding: "base32",
      token: dto.code,
      window: 1
    });
    if (dto.method === "authenticator" && !validTotp) {
      throw new UnauthorizedException("Invalid authenticator code");
    }
    if (dto.method === "recovery" && !/^[a-fA-F0-9]{10}$/.test(dto.code)) {
      throw new UnauthorizedException("Invalid recovery code");
    }

    await this.prisma.$transaction(async (tx) => {
      if (dto.method === "recovery") {
        const backupCode = await tx.backupCode.findFirst({
          where: { userId: user.id, codeHash: this.sha256(dto.code.toLowerCase()), usedAt: null },
          select: { id: true }
        });
        if (!backupCode) throw new UnauthorizedException("Invalid recovery code");

        const consumed = await tx.backupCode.updateMany({
          where: { id: backupCode.id, usedAt: null },
          data: { usedAt: new Date() }
        });
        if (consumed.count !== 1) throw new UnauthorizedException("Recovery code already used");
      }

      const deviceLinks = await tx.deviceUserLink.findMany({
        where: { userId: user.id },
        select: { deviceId: true }
      });
      const deviceIds = deviceLinks.map((link) => link.deviceId);

      if (deviceIds.length > 0) {
        await tx.device.updateMany({
          where: { id: { in: deviceIds }, companyId: user.companyId },
          data: { trusted: false }
        });
      }

      await tx.authSession.updateMany({
        where: { userId: user.id },
        data: { revokedAt: new Date(), trustedUntil: null }
      });
      await tx.backupCode.deleteMany({ where: { userId: user.id } });
      await tx.user.update({
        where: { id: user.id },
        data: {
          totpEnabled: false,
          totpSecretEnc: null,
          trustedDeviceVersion: { increment: 1 }
        }
      });
    });

    return { enabled: false, sessionsRevoked: true };
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
