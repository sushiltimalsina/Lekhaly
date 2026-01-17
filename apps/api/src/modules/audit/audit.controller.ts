import { Controller, Get, Query } from "@nestjs/common";
import { CurrentUser, RequirePerm } from "../../common/auth/auth.decorator";
import { ZodValidationPipe } from "../../common/zod/zod.pipe";
import type { AuthUser } from "../../common/auth/auth.types";
import { AuditQuerySchema } from "./dto/audit.schemas";
import { AuditService } from "./audit.service";

@Controller("audit")
export class AuditController {
  constructor(private audit: AuditService) {}

  @Get()
  @RequirePerm("settings.security")
  list(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(AuditQuerySchema)) query: any
  ) {
    return this.audit.list(user, query);
  }
}
