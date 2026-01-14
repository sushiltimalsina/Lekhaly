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
    setup(body: {
        userId: string;
    }): Promise<{
        base32: string;
        otpauthUrl: string | undefined;
        qrDataUrl: string;
    }>;
    enable(body: any): Promise<{
        enabled: boolean;
        backupCodes: string[];
    }>;
    stepUp(body: any): Promise<{
        stepUpToken: string;
    }>;
}
