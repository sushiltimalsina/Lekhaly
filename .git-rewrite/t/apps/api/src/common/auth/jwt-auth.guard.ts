import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { AuthUser } from "./auth.types";
import { IS_PUBLIC_KEY } from "./auth.decorator";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwt: JwtService, private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();
    const header = req.headers?.authorization || req.headers?.Authorization;
    if (!header || typeof header !== "string") throw new UnauthorizedException("Missing token");

    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) throw new UnauthorizedException("Invalid token");

    const issuer = process.env.JWT_ISSUER;
    const audience = process.env.JWT_AUDIENCE;
    const verifyOptions: { issuer?: string; audience?: string } = {};
    if (issuer) verifyOptions.issuer = issuer;
    if (audience) verifyOptions.audience = audience;
    const payload = this.jwt.verify(token, verifyOptions) as AuthUser & { typ?: string };
    if (payload.typ === "refresh") throw new UnauthorizedException("Invalid token");

    req.user = payload;
    return true;
  }
}
