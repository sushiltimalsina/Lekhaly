import { Body, Controller, Delete, Get, Param, Post, Query } from "@nestjs/common";
import { Audit } from "../../common/audit/audit.decorator";
import { CurrentUser, RequirePerm, RequireStep } from "../../common/auth/auth.decorator";
import { ZodValidationPipe } from "../../common/zod/zod.pipe";
import type { AuthUser } from "../../common/auth/auth.types";
import { DeviceListQuerySchema, DeviceTrustSchema } from "./dto/devices.schemas";
import { DevicesService } from "./devices.service";

@Controller("devices")
@Audit({ entityType: "device", idParam: "id" })
export class DevicesController {
  constructor(private devices: DevicesService) {}

  @Get()
  @RequirePerm("settings.security")
  list(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(DeviceListQuerySchema)) query: any
  ) {
    return this.devices.list(user, query);
  }

  @Post(":id/trust")
  @RequirePerm("settings.security")
  @RequireStep("sensitive")
  setTrust(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(DeviceTrustSchema)) body: any
  ) {
    return this.devices.setTrust(user, id, body.trusted);
  }

  @Delete(":id/users/:userId")
  @RequirePerm("settings.security")
  @RequireStep("sensitive")
  unlinkUser(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Param("userId") userId: string
  ) {
    return this.devices.unlinkUser(user, id, userId);
  }
}
