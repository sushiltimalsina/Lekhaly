import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { CurrentUser, RequirePerm } from "../../common/auth/auth.decorator";
import { ZodValidationPipe } from "../../common/zod/zod.pipe";
import type { AuthUser } from "../../common/auth/auth.types";
import { PullQuerySchema, PushChangeSchema, RegisterDeviceSchema } from "./dto/sync.schemas";
import { SyncService } from "./sync.service";

@Controller("sync")
export class SyncController {
  constructor(private sync: SyncService) {}

  @Post("devices/register")
  @RequirePerm("masters.write")
  register(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(RegisterDeviceSchema)) body: any
  ) {
    return this.sync.registerDevice(user, body);
  }

  @Post("push")
  @RequirePerm("masters.write")
  push(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(PushChangeSchema)) body: any) {
    return this.sync.pushChanges(user, body);
  }

  @Get("pull")
  @RequirePerm("masters.read")
  pull(@CurrentUser() user: AuthUser, @Query(new ZodValidationPipe(PullQuerySchema)) query: any) {
    return this.sync.pullChanges(user, query);
  }
}
