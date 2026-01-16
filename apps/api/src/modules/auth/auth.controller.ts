import { Body, Controller, Get, Post, UsePipes } from "@nestjs/common";
import { CurrentUser, Public, RequirePerm } from "../../common/auth/auth.decorator";
import { AuthUser } from "../../common/auth/auth.types";
import { ZodValidationPipe } from "../../common/zod/zod.pipe";
import { LoginSchema, RefreshSchema, StepUpSchema, TotpEnableSchema } from "./dto/auth.schemas";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post("login")
  @Public()
  @UsePipes(new ZodValidationPipe(LoginSchema))
  login(@Body() body: any) {
    return this.auth.login(body);
  }

  @Post("refresh")
  @Public()
  @UsePipes(new ZodValidationPipe(RefreshSchema))
  refresh(@Body() body: any) {
    return this.auth.refresh(body);
  }

  @Post("logout")
  @Public()
  @UsePipes(new ZodValidationPipe(RefreshSchema))
  logout(@Body() body: any) {
    return this.auth.logout(body.refreshToken);
  }

  @Get("me")
  me(@CurrentUser() user: AuthUser) {
    return user;
  }

  // Use access token identity for TOTP enrollment
  @Post("totp/setup")
  setup(@CurrentUser("sub") userId: string) {
    return this.auth.totpSetup(userId);
  }

  @Post("totp/enable")
  @RequirePerm("settings.security")
  @UsePipes(new ZodValidationPipe(TotpEnableSchema))
  enable(@CurrentUser("sub") userId: string, @Body() body: any) {
    return this.auth.totpEnable(userId, body.code);
  }

  @Post("step-up")
  @UsePipes(new ZodValidationPipe(StepUpSchema))
  stepUp(@CurrentUser("sub") userId: string, @Body() body: any) {
    return this.auth.stepUp(userId, body.code);
  }
}



