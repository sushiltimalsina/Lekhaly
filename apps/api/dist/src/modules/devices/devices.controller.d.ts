import type { AuthUser } from "../../common/auth/auth.types";
import { DevicesService } from "./devices.service";
export declare class DevicesController {
    private devices;
    constructor(devices: DevicesService);
    list(user: AuthUser, query: any): Promise<({
        deviceUsers: ({
            user: {
                id: string;
                email: string;
                name: string | null;
                status: import("@prisma/client").$Enums.UserStatus;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            deviceId: string;
        })[];
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        label: string;
        platform: string;
        trusted: boolean;
        lastSeenAt: Date | null;
    })[]>;
    setTrust(user: AuthUser, id: string, body: any): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        label: string;
        platform: string;
        trusted: boolean;
        lastSeenAt: Date | null;
    }>;
    unlinkUser(user: AuthUser, id: string, userId: string): Promise<{
        deviceId: string;
        userId: string;
        unlinked: boolean;
    }>;
}
