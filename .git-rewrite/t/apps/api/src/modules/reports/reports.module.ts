import { Module } from "@nestjs/common";
import { OutboxModule } from "../outbox/outbox.module";
import { ReportsController } from "./reports.controller";
import { ReportsService } from "./reports.service";

@Module({
  imports: [OutboxModule],
  controllers: [ReportsController],
  providers: [ReportsService]
})
export class ReportsModule {}
