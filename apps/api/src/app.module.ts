import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuditInterceptor } from "./common/audit/audit.interceptor";
import { PrismaModule } from "./common/prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { SyncModule } from "./modules/sync/sync.module";
import { VouchersModule } from "./modules/vouchers/vouchers.module";
import { HealthModule } from "./moduls/health/health.module";

@Module({
  imports: [PrismaModule, HealthModule, AuthModule, ReportsModule, VouchersModule, SyncModule],
  controllers: [AppController],
  providers: [AppService, { provide: APP_INTERCEPTOR, useClass: AuditInterceptor }]
})
export class AppModule {}
