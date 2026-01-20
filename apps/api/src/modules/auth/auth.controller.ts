import { Body, Controller, Get, Patch, Post, UsePipes } from "@nestjs/common";
import { CurrentUser, Public, RequirePerm } from "../../common/auth/auth.decorator";
import type { AuthUser } from "../../common/auth/auth.types";
import { ZodValidationPipe } from "../../common/zod/zod.pipe";
import { CompanySchema, LoginSchema, NotificationsSchema, RefreshSchema, RegisterSchema, StepUpSchema, TotpEnableSchema, ProfileSchema } from "./dto/auth.schemas";
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

  @Post("register")
  @Public()
  register(@Body(new ZodValidationPipe(RegisterSchema)) body: any) {
    return this.auth.register(body);
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

  @Get("profile")
  profile(@CurrentUser("sub") userId: string) {
    return this.auth.getProfile(userId);
  }

  @Patch("profile")
  updateProfile(
    @CurrentUser("sub") userId: string,
    @Body(new ZodValidationPipe(ProfileSchema)) body: any
  ) {
    return this.auth.updateProfile(userId, body);
  }

  @Get("company")
  company(@CurrentUser("sub") userId: string) {
    return this.auth.getCompany(userId);
  }

  @Patch("company")
  updateCompany(
    @CurrentUser("sub") userId: string,
    @Body(new ZodValidationPipe(CompanySchema)) body: any
  ) {
    return this.auth.updateCompany(userId, body);
  }

  @Patch("notifications")
  updateNotifications(
    @CurrentUser("sub") userId: string,
    @Body(new ZodValidationPipe(NotificationsSchema)) body: any
  ) {
    return this.auth.updateNotifications(userId, body);
  }

  @Post("billing/portal")
  billingPortal(@CurrentUser("sub") userId: string) {
    return this.auth.startBillingPortal(userId);
  }

  // Use access token identity for TOTP enrollment
  @Post("totp/setup")
  setup(@CurrentUser("sub") userId: string) {
    return this.auth.totpSetup(userId);
  }

  @Post("totp/enable")
  @RequirePerm("settings.security")
  enable(
    @CurrentUser("sub") userId: string,
    @Body(new ZodValidationPipe(TotpEnableSchema)) body: any
  ) {
    return this.auth.totpEnable(userId, body.code);
  }

  @Post("step-up")
  stepUp(
    @CurrentUser("sub") userId: string,
    @Body(new ZodValidationPipe(StepUpSchema)) body: any
  ) {
    return this.auth.stepUp(userId, body.code);
  }
}



