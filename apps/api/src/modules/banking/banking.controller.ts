import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { Audit } from "../../common/audit/audit.decorator";
import { CurrentUser, RequirePerm, RequireStep } from "../../common/auth/auth.decorator";
import { ZodValidationPipe } from "../../common/zod/zod.pipe";
import type { AuthUser } from "../../common/auth/auth.types";
import {
  AddStatementLineSchema,
  BankStatementListQuerySchema,
  BankSyncConnectSchema,
  CreateBankAccountSchema,
  CreateBankStatementSchema,
  ReconcileSchema
} from "./dto/banking.schemas";
import { BankingService } from "./banking.service";

@Controller("banking")
@Audit({ entityType: "banking", idParam: "id" })
export class BankingController {
  constructor(private banking: BankingService) {}

  @Post("accounts")
  @RequirePerm("masters.write")
  @RequireStep("sensitive")
  createBankAccount(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(CreateBankAccountSchema)) body: any
  ) {
    return this.banking.createBankAccount(user, body);
  }

  @Post("statements")
  @RequirePerm("masters.write")
  @RequireStep("sensitive")
  createStatement(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(CreateBankStatementSchema)) body: any
  ) {
    return this.banking.createStatement(user, body);
  }

  @Post("statements/:id/lines")
  @RequirePerm("masters.write")
  addStatementLine(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(AddStatementLineSchema)) body: any
  ) {
    return this.banking.addStatementLine(user, id, body);
  }

  @Post("reconcile")
  @RequirePerm("masters.write")
  @RequireStep("sensitive")
  reconcile(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(ReconcileSchema)) body: any
  ) {
    return this.banking.reconcile(user, body);
  }

  @Post("reconcile/:lineId/unmatch")
  @RequirePerm("masters.write")
  @RequireStep("sensitive")
  unmatch(@CurrentUser() user: AuthUser, @Param("lineId") lineId: string) {
    return this.banking.unmatch(user, lineId);
  }

  @Get("statements")
  @RequirePerm("masters.read")
  listStatements(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(BankStatementListQuerySchema)) query: any
  ) {
    return this.banking.listStatements(user, query);
  }

  @Get("statements/:id")
  @RequirePerm("masters.read")
  getStatement(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.banking.getStatement(user, id);
  }

  @Post("sync/connect")
  @RequirePerm("settings.security")
  connectSync(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(BankSyncConnectSchema)) body: any
  ) {
    return this.banking.connectBankSync(user, body);
  }

  @Get("sync/status")
  @RequirePerm("settings.security")
  syncStatus(@CurrentUser() user: AuthUser) {
    return this.banking.syncStatus(user);
  }

  @Post("sync/refresh")
  @RequirePerm("settings.security")
  refreshSync(@CurrentUser() user: AuthUser) {
    return this.banking.refreshSync(user);
  }
}
