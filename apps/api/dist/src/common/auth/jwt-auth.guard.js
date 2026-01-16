"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const jwt_1 = require("@nestjs/jwt");
const auth_decorator_1 = require("./auth.decorator");
let JwtAuthGuard = class JwtAuthGuard {
    jwt;
    reflector;
    constructor(jwt, reflector) {
        this.jwt = jwt;
        this.reflector = reflector;
    }
    canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(auth_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass()
        ]);
        if (isPublic)
            return true;
        const req = context.switchToHttp().getRequest();
        const header = req.headers?.authorization || req.headers?.Authorization;
        if (!header || typeof header !== "string")
            throw new common_1.UnauthorizedException("Missing token");
        const [scheme, token] = header.split(" ");
        if (scheme !== "Bearer" || !token)
            throw new common_1.UnauthorizedException("Invalid token");
        const issuer = process.env.JWT_ISSUER;
        const audience = process.env.JWT_AUDIENCE;
        const verifyOptions = {};
        if (issuer)
            verifyOptions.issuer = issuer;
        if (audience)
            verifyOptions.audience = audience;
        const payload = this.jwt.verify(token, verifyOptions);
        if (payload.typ === "refresh")
            throw new common_1.UnauthorizedException("Invalid token");
        req.user = payload;
        return true;
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService, core_1.Reflector])
], JwtAuthGuard);
//# sourceMappingURL=jwt-auth.guard.js.map