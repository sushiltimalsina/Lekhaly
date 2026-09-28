import { Body, Controller, Get, Patch, Post, Query, Res, UsePipes } from "@nestjs/common";
import type { Response } from "express";
import { CurrentUser, Public } from "../../common/auth/auth.decorator";
import type { AuthUser } from "../../common/auth/auth.types";
import { ZodValidationPipe } from "../../common/zod/zod.pipe";
import {
  CompanySchema,
  CompleteCompanyOnboardingSchema,
  ForgotPasswordSchema,
  GoogleAuthCallbackSchema,
  GoogleAuthStartSchema,
  LinkedInAuthCallbackSchema,
  LinkedInAuthStartSchema,
  MicrosoftAuthCallbackSchema,
  MicrosoftAuthStartSchema,
  LoginSchema,
  LoginTotpSchema,
  NotificationsSchema,
  RefreshSchema,
  RegisterSchema,
  ResetPasswordSchema,
  StepUpSchema,
  TotpEnableSchema,
  TotpDisableSchema,
  TotpDisablePasswordSchema,
  TotpRecoveryRegenerateSchema,
  TotpRecoveryRegeneratePasswordSchema,
  ProfileSchema
} from "./dto/auth.schemas";
import { AuthService } from "./auth.service";

@Controller("v1/auth")
export class AuthV1Controller {
  constructor(private auth: AuthService) {}

  @Post("login")
  @Public()
  @UsePipes(new ZodValidationPipe(LoginSchema))
  login(@Body() body: any) {
    return this.auth.login(body);
  }

  @Post("login/totp")
  @Public()
  @UsePipes(new ZodValidationPipe(LoginTotpSchema))
  loginTotp(@Body() body: any) {
    return this.auth.loginTotp(body);
  }

  @Post("register")
  @Public()
  register(@Body(new ZodValidationPipe(RegisterSchema)) body: any) {
    return this.auth.register(body);
  }

  @Get("google")
  @Public()
  async google(@Query(new ZodValidationPipe(GoogleAuthStartSchema)) query: any, @Res() response: Response) {
    response.redirect(await this.auth.getGoogleAuthorizationUrl(query));
  }

  @Get("google/callback")
  @Public()
  async googleCallback(@Query(new ZodValidationPipe(GoogleAuthCallbackSchema)) query: any, @Res() response: Response) {
    try {
      response.redirect(await this.auth.completeGoogleAuthorization(query));
    } catch (error) {
      const redirectUrl = await this.auth.getGoogleFailureRedirect(query.state, error);
      if (redirectUrl) return response.redirect(redirectUrl);
      throw error;
    }
  }

  @Get("linkedin")
  @Public()
  async linkedIn(@Query(new ZodValidationPipe(LinkedInAuthStartSchema)) query: any, @Res() response: Response) {
    response.redirect(await this.auth.getLinkedInAuthorizationUrl(query));
  }

  @Get("linkedin/callback")
  @Public()
  async linkedInCallback(@Query(new ZodValidationPipe(LinkedInAuthCallbackSchema)) query: any, @Res() response: Response) {
    try {
      response.redirect(await this.auth.completeLinkedInAuthorization(query));
    } catch (error) {
      const redirectUrl = await this.auth.getLinkedInFailureRedirect(query.state, error);
      if (redirectUrl) return response.redirect(redirectUrl);
      throw error;
    }
  }

  @Get("microsoft")
  @Public()
  async microsoft(@Query(new ZodValidationPipe(MicrosoftAuthStartSchema)) query: any, @Res() response: Response) {
    response.redirect(await this.auth.getMicrosoftAuthorizationUrl(query));
  }

  @Get("microsoft/callback")
  @Public()
  async microsoftCallback(@Query(new ZodValidationPipe(MicrosoftAuthCallbackSchema)) query: any, @Res() response: Response) {
    try {
      response.redirect(await this.auth.completeMicrosoftAuthorization(query));
    } catch (error) {
      const redirectUrl = await this.auth.getMicrosoftFailureRedirect(query.state, error);
      if (redirectUrl) return response.redirect(redirectUrl);
      throw error;
    }
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

  @Post("forgot-password")
  @Public()
  @UsePipes(new ZodValidationPipe(ForgotPasswordSchema))
  forgotPassword(@Body() body: any) {
    return this.auth.requestPasswordReset(body.email);
  }

  @Post("reset-password")
  @Public()
  @UsePipes(new ZodValidationPipe(ResetPasswordSchema))
  resetPassword(@Body() body: any) {
    return this.auth.resetPassword({ token: body.token, password: body.password });
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

  @Post("company/complete-onboarding")
  completeCompanyOnboarding(
    @CurrentUser("sub") userId: string,
    @Body(new ZodValidationPipe(CompleteCompanyOnboardingSchema)) body: any
  ) {
    return this.auth.completeCompanyOnboarding(userId, body);
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

  @Get("totp/status")
  totpStatus(@CurrentUser("sub") userId: string) {
    return this.auth.totpStatus(userId);
  }

  @Post("totp/setup")
  setup(@CurrentUser("sub") userId: string) {
    return this.auth.totpSetup(userId);
  }

  @Post("totp/enable")
  enable(
    @CurrentUser("sub") userId: string,
    @Body(new ZodValidationPipe(TotpEnableSchema)) body: any
  ) {
    return this.auth.totpEnable(userId, body.code);
  }

  @Post("totp/recovery-codes/regenerate")
  regenerateTotpRecoveryCodes(
    @CurrentUser("sub") userId: string,
    @Body(new ZodValidationPipe(TotpRecoveryRegenerateSchema)) body: any
  ) {
    return this.auth.regenerateTotpRecoveryCodes(userId, body);
  }

  @Post("totp/recovery-codes/verify-password")
  verifyTotpRecoveryPassword(
    @CurrentUser("sub") userId: string,
    @Body(new ZodValidationPipe(TotpRecoveryRegeneratePasswordSchema)) body: any
  ) {
    return this.auth.verifyTotpRecoveryPassword(userId, body.password);
  }

  @Post("totp/disable")
  disableTotp(
    @CurrentUser("sub") userId: string,
    @Body(new ZodValidationPipe(TotpDisableSchema)) body: any
  ) {
    return this.auth.totpDisable(userId, body);
  }

  @Post("totp/disable/verify-password")
  verifyTotpDisablePassword(
    @CurrentUser("sub") userId: string,
    @Body(new ZodValidationPipe(TotpDisablePasswordSchema)) body: any
  ) {
    return this.auth.verifyTotpDisablePassword(userId, body.password);
  }

  @Post("step-up")
  stepUp(
    @CurrentUser("sub") userId: string,
    @Body(new ZodValidationPipe(StepUpSchema)) body: any
  ) {
    return this.auth.stepUp(userId, body.code);
  }
}
