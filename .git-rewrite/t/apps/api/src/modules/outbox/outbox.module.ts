import { Module } from "@nestjs/common";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { OutboxController } from "./outbox.controller";
import { OutboxService } from "./outbox.service";
import { OutboxWorkerService } from "./outbox.worker";

@Module({
  imports: [PrismaModule],
  controllers: [OutboxController],
  providers: [OutboxService, OutboxWorkerService],
  exports: [OutboxService]
})
export class OutboxModule {}
