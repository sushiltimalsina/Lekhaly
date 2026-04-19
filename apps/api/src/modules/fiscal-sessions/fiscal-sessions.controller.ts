import { Body, Controller, Get, Param, Post, Put, Query } from "@nestjs/common";
import { CurrentUser, RequirePerm } from "../../common/auth/auth.decorator";
import { ZodValidationPipe } from "../../common/zod/zod.pipe";
import type { AuthUser } from "../../common/auth/auth.types";
import { CreateFiscalSessionSchema } from "./dto/fiscal-session.schemas";
import { FiscalSessionsService } from "./fiscal-sessions.service";

@Controller("fiscal-sessions")
export class FiscalSessionsController {
  constructor(private fiscalSessions: FiscalSessionsService) {}

  @Get()
  @RequirePerm("masters.read")
  list(@CurrentUser() user: AuthUser) {
    return this.fiscalSessions.listSessions(user);
  }

  @Post()
  @RequirePerm("masters.write")
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(CreateFiscalSessionSchema)) body: any
  ) {
    return this.fiscalSessions.createSession(user, body);
  }

  @Put(":id/switch")
  @RequirePerm("masters.write")
  switch(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.fiscalSessions.switchSession(user, id);
  }

  @Put(":id/lock")
  @RequirePerm("masters.write")
  lock(
    @CurrentUser() user: AuthUser, 
    @Param("id") id: string,
    @Body("lock") lock: boolean
  ) {
    return this.fiscalSessions.lockSession(user, id, lock);
  }
}
