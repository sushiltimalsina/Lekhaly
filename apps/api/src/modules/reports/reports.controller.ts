import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { CurrentUser, RequirePerm, RequireStep } from "../../common/auth/auth.decorator";
import { ZodValidationPipe } from "../../common/zod/zod.pipe";
import type { AuthUser } from "../../common/auth/auth.types";
import { ExportReportSchema, PartyAgingQuerySchema, ReportQuerySchema } from "./dto/report.schemas";
import { ReportsService } from "./reports.service";

@Controller("reports")
export class ReportsController {
  constructor(private reports: ReportsService) {}

  @Get("trial-balance")
  @RequirePerm("reports.view")
  trialBalance(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(ReportQuerySchema)) query: any
  ) {
    return this.reports.trialBalance(user.companyId, query);
  }

  @Get("profit-loss")
  @RequirePerm("reports.view")
  profitLoss(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(ReportQuerySchema)) query: any
  ) {
    return this.reports.profitAndLoss(user.companyId, query);
  }

  @Get("balance-sheet")
  @RequirePerm("reports.view")
  balanceSheet(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(ReportQuerySchema)) query: any
  ) {
    return this.reports.balanceSheet(user.companyId, query);
  }

  @Get("party-aging")
  @RequirePerm("reports.view")
  partyAging(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(PartyAgingQuerySchema)) query: any
  ) {
    return this.reports.partyAging(user.companyId, query);
  }

  @Post("export")
  @RequirePerm("export.pdf")
  @RequireStep("sensitive")
  export(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(ExportReportSchema)) body: any
  ) {
    return this.reports.exportPdf(user.companyId, body);
  }
}
