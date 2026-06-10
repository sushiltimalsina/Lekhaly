import { Module } from "@nestjs/common";
import { InventoryModule } from "../inventory/inventory.module";
import { VouchersController } from "./vouchers.controller";
import { VouchersService } from "./vouchers.service";

@Module({
  imports: [InventoryModule],
  controllers: [VouchersController],
  providers: [VouchersService],
  exports: [VouchersService]
})
export class VouchersModule { }
