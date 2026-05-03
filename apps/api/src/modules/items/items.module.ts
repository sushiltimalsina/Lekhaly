import { Module } from "@nestjs/common";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { InventoryModule } from "../inventory/inventory.module";
import { ItemsController } from "./items.controller";
import { ItemsSeederService } from "./items-seeder.service";
import { ItemsService } from "./items.service";

@Module({
  imports: [PrismaModule, InventoryModule],
  controllers: [ItemsController],
  providers: [ItemsService, ItemsSeederService],
  exports: [ItemsService, ItemsSeederService]
})
export class ItemsModule {}
