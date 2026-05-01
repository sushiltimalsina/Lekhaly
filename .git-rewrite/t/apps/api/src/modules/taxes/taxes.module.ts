import { Module } from "@nestjs/common";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { TaxesController } from "./taxes.controller";
import { TaxesService } from "./taxes.service";

@Module({
  imports: [PrismaModule],
  controllers: [TaxesController],
  providers: [TaxesService]
})
export class TaxesModule {}
