import { Module } from "@nestjs/common";
import { FiscalSessionsController } from "./fiscal-sessions.controller";
import { FiscalSessionsService } from "./fiscal-sessions.service";

@Module({
  controllers: [FiscalSessionsController],
  providers: [FiscalSessionsService],
  exports: [FiscalSessionsService],
})
export class FiscalSessionsModule {}
