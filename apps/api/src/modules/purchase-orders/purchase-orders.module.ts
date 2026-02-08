import { Module } from "@nestjs/common";
import { PurchaseOrdersController } from "./purchase-orders.controller";
import { PurchaseOrdersService } from "./purchase-orders.service";
import { VouchersModule } from "../vouchers/vouchers.module";

@Module({
    imports: [VouchersModule],
    controllers: [PurchaseOrdersController],
    providers: [PurchaseOrdersService],
    exports: [PurchaseOrdersService]
})
export class PurchaseOrdersModule { }
