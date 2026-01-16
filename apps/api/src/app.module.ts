import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./common/prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { HealthModule } from "./moduls/health/health.module";
import { ReportsModule } from "./modules/reports/reports.module";

@Module({
  imports: [PrismaModule, HealthModule, AuthModule, ReportsModule],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
