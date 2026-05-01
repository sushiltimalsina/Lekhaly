import { Module } from "@nestjs/common";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { InventoryController } from "./inventory.controller";
import { InventoryService } from "./inventory.service";
import { StockCountsController } from "./stock-counts.controller";
import { StockCountsService } from "./stock-counts.service";

@Module({
  imports: [PrismaModule],
  controllers: [InventoryController, StockCountsController],
  providers: [InventoryService, StockCountsService],
  exports: [InventoryService, StockCountsService]
})
export class InventoryModule {}
