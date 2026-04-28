import { Module } from "@nestjs/common";
import { AccountsController } from "./accounts.controller";
import { AccountsService } from "./accounts.service";
import { CoaSeederService } from "./coa-seeder.service";

@Module({
  controllers: [AccountsController],
  providers: [AccountsService, CoaSeederService],
  exports: [AccountsService, CoaSeederService]
})
export class AccountsModule {}
