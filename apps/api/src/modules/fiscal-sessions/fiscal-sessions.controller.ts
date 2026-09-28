import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import { Audit } from "../../common/audit/audit.decorator";
import { CurrentUser, RequirePerm } from "../../common/auth/auth.decorator";
import { ZodValidationPipe } from "../../common/zod/zod.pipe";
import type { AuthUser } from "../../common/auth/auth.types";
import { CreateFiscalSessionSchema, LockFiscalSessionSchema } from "./dto/fiscal-session.schemas";
import { FiscalSessionsService } from "./fiscal-sessions.service";

@Controller("fiscal-sessions")
export class FiscalSessionsController {
  constructor(private fiscalSessions: FiscalSessionsService) {}

  @Get()
  @RequirePerm("masters.read")
  list(@CurrentUser() user: AuthUser) {
    return this.fiscalSessions.listSessions(user);
  }

  @Get("active")
  @RequirePerm("masters.read")
  getActive(@CurrentUser() user: AuthUser) {
    return this.fiscalSessions.getActiveSession(user);
  }

  @Post()
  @RequirePerm("masters.write")
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(CreateFiscalSessionSchema)) body: any
  ) {
    return this.fiscalSessions.createSession(user, body);
  }

  @Post(":id/next")
  @RequirePerm("masters.write")
  createNext(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() body: { name: string; startDate: string; endDate: string; lockCurrent: boolean },
  ) {
    return this.fiscalSessions.createNextFiscalYear(user, id, body);
  }

  @Put(":id/switch")
  @RequirePerm("masters.write")
  switch(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.fiscalSessions.switchSession(user, id);
  }

  @Put(":id/lock")
  @Audit({ entityType: "fiscalSession", idParam: "id" })
  @RequirePerm("masters.write")
  lock(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(LockFiscalSessionSchema)) body: any
  ) {
    return this.fiscalSessions.lockSession(user, id, body);
  }
}
