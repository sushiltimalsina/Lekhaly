import { Module } from "@nestjs/common";
import { SalesOrdersController } from "./sales-orders.controller";
import { SalesOrdersService } from "./sales-orders.service";
import { InvoicesModule } from "../invoices/invoices.module";

@Module({
    imports: [InvoicesModule],
    controllers: [SalesOrdersController],
    providers: [SalesOrdersService],
    exports: [SalesOrdersService]
})
export class SalesOrdersModule { }
