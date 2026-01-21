import { Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
import { Audit } from "../../common/audit/audit.decorator";
import { CurrentUser, RequirePerm } from "../../common/auth/auth.decorator";
import { ZodValidationPipe } from "../../common/zod/zod.pipe";
import type { AuthUser } from "../../common/auth/auth.types";
import { TaxCodeSchema, TaxListQuerySchema, VatReportQuerySchema } from "./dto/tax.schemas";
import { TaxesService } from "./taxes.service";

@Controller("taxes")
@Audit({ entityType: "tax", idParam: "id" })
export class TaxesController {
  constructor(private taxes: TaxesService) {}

  @Get()
  @RequirePerm("settings.tax")
  list(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(TaxListQuerySchema)) query: any
  ) {
    return this.taxes.list(user, query);
  }

  @Post()
  @RequirePerm("settings.tax")
  create(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(TaxCodeSchema)) body: any) {
    return this.taxes.create(user, body);
  }

  @Get(":id")
  @RequirePerm("settings.tax")
  get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.taxes.get(user, id);
  }

  @Put(":id")
  @RequirePerm("settings.tax")
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(TaxCodeSchema)) body: any
  ) {
    return this.taxes.update(user, id, body);
  }

  @Delete(":id")
  @RequirePerm("settings.tax")
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.taxes.remove(user, id);
  }

  @Get("reports/vat")
  @RequirePerm("reports.view")
  vatReport(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(VatReportQuerySchema)) query: any
  ) {
    return this.taxes.vatReport(user, query.from, query.to);
  }

  @Get("reports/vat/summary")
  @RequirePerm("reports.view")
  vatSummary(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(VatReportQuerySchema)) query: any
  ) {
    return this.taxes.vatSummary(user, query.from, query.to);
  }
}
