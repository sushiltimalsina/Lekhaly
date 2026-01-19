import { Module } from "@nestjs/common";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { OutboxController } from "./outbox.controller";
import { OutboxService } from "./outbox.service";

@Module({
  imports: [PrismaModule],
  controllers: [OutboxController],
  providers: [OutboxService],
  exports: [OutboxService]
})
export class OutboxModule {}
