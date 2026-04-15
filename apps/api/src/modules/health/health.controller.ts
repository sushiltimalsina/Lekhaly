import { Controller, Get } from "@nestjs/common";
import { Public } from "../../common/auth/auth.decorator";

@Controller("health")
export class HealthController {
  @Get()
  @Public()
  ok() {
    return { ok: true, name: "Lekhaly API", timestamp: new Date().toISOString() };
  }
}
