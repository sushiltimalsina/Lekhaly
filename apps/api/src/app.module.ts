import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./common/prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { HealthModule } from "./moduls/health/health.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { VouchersModule } from "./modules/vouchers/vouchers.module";

@Module({
  imports: [PrismaModule, HealthModule, AuthModule, ReportsModule, VouchersModule],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
