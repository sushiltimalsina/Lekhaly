import { createParamDecorator, ExecutionContext, SetMetadata } from "@nestjs/common";
import { AuthUser } from "./auth.types";

export const IS_PUBLIC_KEY = "isPublic";
export const PERMS_KEY = "requiredPerms";

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
export const RequirePerm = (...perms: string[]) => SetMetadata(PERMS_KEY, perms);

export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user as AuthUser | undefined;
    if (!user) return undefined;
    return data ? user[data] : user;
  }
);
