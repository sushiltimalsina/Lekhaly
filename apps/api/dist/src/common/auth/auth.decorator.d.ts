import { AuthUser } from "./auth.types";
export declare const IS_PUBLIC_KEY = "isPublic";
export declare const PERMS_KEY = "requiredPerms";
export declare const STEP_KEY = "requiredStep";
export declare const Public: () => import("@nestjs/common").CustomDecorator<string>;
export declare const RequirePerm: (...perms: string[]) => import("@nestjs/common").CustomDecorator<string>;
export declare const RequireStep: (step: "sensitive") => import("@nestjs/common").CustomDecorator<string>;
export declare const CurrentUser: (...dataOrPipes: (keyof AuthUser | import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>> | undefined)[]) => ParameterDecorator;
