import { Module } from "@nestjs/common";
import { SaleTypesController } from "./sale-types.controller";
import { SaleTypesService } from "./sale-types.service";

@Module({
  controllers: [SaleTypesController],
  providers: [SaleTypesService],
  exports: [SaleTypesService],
})
export class SaleTypesModule {}
