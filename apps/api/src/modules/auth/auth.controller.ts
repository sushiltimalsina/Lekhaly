import { Body, Controller, Post, UsePipes } from "@nestjs/common";
import { ZodValidationPipe } from "../../common/zod/zod.pipe";
import { LoginSchema, RefreshSchema, StepUpSchema, TotpEnableSchema } from "./dto/auth.schemas";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post("login")
  @UsePipes(new ZodValidationPipe(LoginSchema))
  login(@Body() body: any) {
    return this.auth.login(body);
  }

  @Post("refresh")
  @UsePipes(new ZodValidationPipe(RefreshSchema))
  refresh(@Body() body: any) {
    return this.auth.refresh(body);
  }

  @Post("logout")
  @UsePipes(new ZodValidationPipe(RefreshSchema))
  logout(@Body() body: any) {
    return this.auth.logout(body.refreshToken);
  }

  // For MVP: well pass userId in body or from JWT later
  @Post("totp/setup")
  setup(@Body() body: { userId: string }) {
    return this.auth.totpSetup(body.userId);
  }

  @Post("totp/enable")
  @UsePipes(new ZodValidationPipe(TotpEnableSchema.extend({ userId: TotpEnableSchema.shape.code.transform(() => undefined) }).passthrough()))
  enable(@Body() body: any) {
    return this.auth.totpEnable(body.userId, body.code);
  }

  @Post("step-up")
  @UsePipes(new ZodValidationPipe(StepUpSchema.extend({ userId: StepUpSchema.shape.code.transform(() => undefined) }).passthrough()))
  stepUp(@Body() body: any) {
    return this.auth.stepUp(body.userId, body.code);
  }
}



