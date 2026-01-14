import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./common/prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { HealthModule } from "./moduls/health/health.module";

@Module({
  imports: [PrismaModule, HealthModule, AuthModule],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
