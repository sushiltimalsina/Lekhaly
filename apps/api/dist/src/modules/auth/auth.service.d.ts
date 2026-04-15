import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../common/prisma/prisma.service";
export declare class AuthService {
    private prisma;
    private jwt;
    private readonly logger;
    constructor(prisma: PrismaService, jwt: JwtService);
    private getUserWithPerms;
    private getUserWithPermsById;
    private signAccessToken;
    private signRefreshToken;
    private sha256;
    private ensurePermissions;
    private createDefaultMasterData;
    register(dto: {
        companyCode: string;
        companyName: string;
        name: string;
        email: string;
        password: string;
    }): Promise<{
        companyId: string;
        userId: string;
    }>;
    getProfile(userId: string): Promise<{
        id: string;
        companyId: string;
        email: string;
        name: string | null;
    }>;
    updateProfile(userId: string, dto: {
        name?: string;
        email?: string;
    }): Promise<{
        id: string;
        companyId: string;
        email: string;
        name: string | null;
    }>;
    getCompany(userId: string): Promise<{
        id: string;
        name: string;
        baseCurrency: string;
        timezone: string;
        fiscalYearStartMonth: number;
        invoicePrefix: string;
    } | null>;
    updateCompany(userId: string, dto: {
        name?: string;
        baseCurrency?: string;
        timezone?: string;
        fiscalYearStartMonth?: number;
        invoicePrefix?: string;
    }): Promise<{
        id: string;
        name: string;
        baseCurrency: string;
        timezone: string;
        fiscalYearStartMonth: number;
        invoicePrefix: string;
    }>;
    updateNotifications(userId: string, dto: {
        emailAlerts?: boolean;
        reportAlerts?: boolean;
        securityAlerts?: boolean;
    }): Promise<{
        ok: boolean;
    }>;
    startBillingPortal(userId: string): Promise<{
        ok: boolean;
    }>;
    login(dto: {
        companyCode: string;
        email: string;
        password: string;
        totpCode?: string;
        deviceId?: string;
        deviceLabel?: string;
        rememberDevice?: boolean;
    }): Promise<{
        accessToken: string;
        refreshToken: string;
        userId: string;
        companyId: string;
        perms: string[];
        deviceId: string | null;
    }>;
    refresh(dto: {
        refreshToken: string;
    }): Promise<{
        accessToken: string;
        refreshToken: string;
        userId: string;
        companyId: string;
        perms: string[];
    }>;
    logout(refreshToken: string): Promise<{
        ok: boolean;
    }>;
    totpSetup(userId: string): Promise<{
        base32: string;
        otpauthUrl: string | undefined;
        qrDataUrl: string;
    }>;
    totpEnable(userId: string, code: string): Promise<{
        enabled: boolean;
        backupCodes: string[];
    }>;
    stepUp(userId: string, code: string): Promise<{
        stepUpToken: string;
    }>;
}
