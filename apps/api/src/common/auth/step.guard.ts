import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthUser } from "./auth.types";
import { STEP_KEY } from "./auth.decorator";

@Injectable()
export class StepUpGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<"sensitive" | undefined>(STEP_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (!required) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user as AuthUser | undefined;
    if (!user) return false;
    if (user.step !== required) throw new ForbiddenException("Step-up required");
    return true;
  }
}
