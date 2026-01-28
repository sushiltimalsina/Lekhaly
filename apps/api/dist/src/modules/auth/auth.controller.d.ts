import type { AuthUser } from "../../common/auth/auth.types";
import { AuthService } from "./auth.service";
export declare class AuthController {
    private auth;
    constructor(auth: AuthService);
    login(body: any): Promise<{
        accessToken: string;
        refreshToken: string;
        userId: string;
        companyId: string;
        perms: string[];
        deviceId: string | null;
    }>;
    register(body: any): Promise<{
        companyId: string;
        userId: string;
    }>;
    refresh(body: any): Promise<{
        accessToken: string;
        refreshToken: string;
        userId: string;
        companyId: string;
        perms: string[];
    }>;
    logout(body: any): Promise<{
        ok: boolean;
    }>;
    me(user: AuthUser): AuthUser;
    profile(userId: string): Promise<{
        companyId: string;
        id: string;
        name: string | null;
        email: string;
    }>;
    updateProfile(userId: string, body: any): Promise<{
        companyId: string;
        id: string;
        name: string | null;
        email: string;
    }>;
    company(userId: string): Promise<{
        id: string;
        name: string;
        baseCurrency: string;
        timezone: string;
        fiscalYearStartMonth: number;
        invoicePrefix: string;
    } | null>;
    updateCompany(userId: string, body: any): Promise<{
        id: string;
        name: string;
        baseCurrency: string;
        timezone: string;
        fiscalYearStartMonth: number;
        invoicePrefix: string;
    }>;
    updateNotifications(userId: string, body: any): Promise<{
        ok: boolean;
    }>;
    billingPortal(userId: string): Promise<{
        ok: boolean;
    }>;
    setup(userId: string): Promise<{
        base32: string;
        otpauthUrl: string | undefined;
        qrDataUrl: string;
    }>;
    enable(userId: string, body: any): Promise<{
        enabled: boolean;
        backupCodes: string[];
    }>;
    stepUp(userId: string, body: any): Promise<{
        stepUpToken: string;
    }>;
}
