import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../common/prisma/prisma.service";
export declare class AuthService {
    private prisma;
    private jwt;
    constructor(prisma: PrismaService, jwt: JwtService);
    private getUserWithPerms;
    private signAccessToken;
    private signRefreshToken;
    private sha256;
    login(dto: {
        companyId: string;
        email: string;
        password: string;
        totpCode?: string;
        deviceLabel?: string;
        rememberDevice?: boolean;
    }): Promise<{
        accessToken: string;
        refreshToken: string;
        userId: string;
        companyId: string;
        perms: string[];
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
