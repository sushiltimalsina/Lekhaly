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
