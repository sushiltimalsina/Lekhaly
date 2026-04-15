import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { CurrentUser, Public, RequirePerm } from "../../common/auth/auth.decorator";
import { ZodValidationPipe } from "../../common/zod/zod.pipe";
import type { AuthUser } from "../../common/auth/auth.types";
import { NextNumberSchema, PullQuerySchema, PushChangeSchema, RegisterDeviceSchema } from "./dto/sync.schemas";
import { SyncService } from "./sync.service";

@Controller("sync")
export class SyncController {
  constructor(private sync: SyncService) {}

  /** Register a new desktop device for sync */
  @Post("devices/register")
  @RequirePerm("masters.write")
  register(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(RegisterDeviceSchema)) body: any
  ) {
    return this.sync.registerDevice(user, body);
  }

  /**
   * Micro-sync: fetch the next voucher number.
   * Ultra-lightweight (~200 bytes). Works on 2G/Edge.
   */
  @Post("next-number")
  @RequirePerm("voucher.post")
  nextNumber(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(NextNumberSchema)) body: any
  ) {
    return this.sync.reserveNextNumber(user, body);
  }

  /** Connectivity check — no auth required, minimal payload */
  @Get("ping")
  @Public()
  ping() {
    return this.sync.ping();
  }

  /** Push offline changes to server */
  @Post("push")
  @RequirePerm("masters.write")
  push(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(PushChangeSchema)) body: any) {
    return this.sync.pushChanges(user, body);
  }

  /** Pull changes since last sync */
  @Get("pull")
  @RequirePerm("masters.read")
  pull(@CurrentUser() user: AuthUser, @Query(new ZodValidationPipe(PullQuerySchema)) query: any) {
    return this.sync.pullChanges(user, query);
  }
}
