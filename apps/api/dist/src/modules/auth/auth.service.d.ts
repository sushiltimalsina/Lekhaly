import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../common/prisma/prisma.service";
export declare class AuthService {
    private prisma;
    private jwt;
    constructor(prisma: PrismaService, jwt: JwtService);
    private getUserWithPerms;
    private getUserWithPermsById;
    private signAccessToken;
    private signRefreshToken;
    private sha256;
    private ensurePermissions;
    register(dto: {
        companyName: string;
        name: string;
        email: string;
        password: string;
    }): Promise<{
        companyId: string;
        userId: string;
    }>;
    getProfile(userId: string): Promise<{
        companyId: string;
        id: string;
        name: string | null;
        email: string;
    }>;
    updateProfile(userId: string, dto: {
        name?: string;
        email?: string;
    }): Promise<{
        companyId: string;
        id: string;
        name: string | null;
        email: string;
    }>;
    login(dto: {
        companyId: string;
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
