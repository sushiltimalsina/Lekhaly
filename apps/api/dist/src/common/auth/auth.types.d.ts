export type AuthUser = {
    sub: string;
    companyId: string;
    perms: string[];
    step: "none" | "sensitive";
    ver: number;
};
