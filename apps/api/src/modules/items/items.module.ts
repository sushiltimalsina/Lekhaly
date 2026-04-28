import { Module } from "@nestjs/common";
import { InventoryModule } from "../inventory/inventory.module";
import { ItemsController } from "./items.controller";
import { ItemsService } from "./items.service";
import { ItemsSeederService } from "./items-seeder.service";

@Module({
  imports: [InventoryModule],
  controllers: [ItemsController],
  providers: [ItemsService, ItemsSeederService],
  exports: [ItemsService, ItemsSeederService]
})
export class ItemsModule {}
