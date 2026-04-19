import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import type { JwtSignOptions } from "@nestjs/jwt";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { PermissionsGuard } from "../../common/auth/permissions.guard";
import { StepUpGuard } from "../../common/auth/step.guard";
import { AuthController } from "./auth.controller";
import { AuthV1Controller } from "./auth.controller.v1";
import { AuthService } from "./auth.service";
import { FiscalSessionsModule } from "../fiscal-sessions/fiscal-sessions.module";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET || "dev-secret",
      signOptions: (() => {
        const issuer = process.env.JWT_ISSUER;
        const audience = process.env.JWT_AUDIENCE;
        const options: JwtSignOptions = { expiresIn: 86400 };
        if (issuer) options.issuer = issuer;
        if (audience) options.audience = audience;
        return options;
      })()
    }),
    FiscalSessionsModule,
  ],
  controllers: [AuthController, AuthV1Controller],
  providers: [
    AuthService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_GUARD, useClass: StepUpGuard }
  ]
})
export class AuthModule { }
