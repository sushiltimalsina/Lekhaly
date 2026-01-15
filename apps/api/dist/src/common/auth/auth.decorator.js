"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentUser = exports.RequirePerm = exports.Public = exports.PERMS_KEY = exports.IS_PUBLIC_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.IS_PUBLIC_KEY = "isPublic";
exports.PERMS_KEY = "requiredPerms";
const Public = () => (0, common_1.SetMetadata)(exports.IS_PUBLIC_KEY, true);
exports.Public = Public;
const RequirePerm = (...perms) => (0, common_1.SetMetadata)(exports.PERMS_KEY, perms);
exports.RequirePerm = RequirePerm;
exports.CurrentUser = (0, common_1.createParamDecorator)((data, ctx) => {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;
    if (!user)
        return undefined;
    return data ? user[data] : user;
});
//# sourceMappingURL=auth.decorator.js.map