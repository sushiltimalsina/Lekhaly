"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentUser = exports.RequireStep = exports.RequirePerm = exports.Public = exports.STEP_KEY = exports.PERMS_KEY = exports.IS_PUBLIC_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.IS_PUBLIC_KEY = "isPublic";
exports.PERMS_KEY = "requiredPerms";
exports.STEP_KEY = "requiredStep";
const Public = () => (0, common_1.SetMetadata)(exports.IS_PUBLIC_KEY, true);
exports.Public = Public;
const RequirePerm = (...perms) => (0, common_1.SetMetadata)(exports.PERMS_KEY, perms);
exports.RequirePerm = RequirePerm;
const RequireStep = (step) => (0, common_1.SetMetadata)(exports.STEP_KEY, step);
exports.RequireStep = RequireStep;
exports.CurrentUser = (0, common_1.createParamDecorator)((data, ctx) => {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;
    if (!user)
        return undefined;
    return data ? user[data] : user;
});
//# sourceMappingURL=auth.decorator.js.map