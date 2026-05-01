import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { Audit } from "../../common/audit/audit.decorator";
import { CurrentUser, RequirePerm, RequireStep } from "../../common/auth/auth.decorator";
import { ZodValidationPipe } from "../../common/zod/zod.pipe";
import type { AuthUser } from "../../common/auth/auth.types";
import { OutboxAckSchema, OutboxListQuerySchema } from "./dto/outbox.schemas";
import { OutboxService } from "./outbox.service";

@Controller("outbox")
@Audit({ entityType: "outbox", idParam: "id" })
export class OutboxController {
  constructor(private outbox: OutboxService) {}

  @Get()
  @RequirePerm("settings.security")
  list(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(OutboxListQuerySchema)) query: any
  ) {
    return this.outbox.list(user, query);
  }

  @Post(":id/ack")
  @RequirePerm("settings.security")
  @RequireStep("sensitive")
  ack(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(OutboxAckSchema)) body: any
  ) {
    return this.outbox.ack(user, id, body);
  }
}
