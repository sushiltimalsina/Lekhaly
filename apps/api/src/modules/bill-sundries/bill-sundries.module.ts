import { Module } from "@nestjs/common";
import { BillSundriesController } from "./bill-sundries.controller";
import { BillSundriesService } from "./bill-sundries.service";

@Module({
    controllers: [BillSundriesController],
    providers: [BillSundriesService],
    exports: [BillSundriesService]
})
export class BillSundriesModule { }
