import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { Audit } from "../../common/audit/audit.decorator";
import { CurrentUser, RequirePerm, RequireStep } from "../../common/auth/auth.decorator";
import { ZodValidationPipe } from "../../common/zod/zod.pipe";
import type { AuthUser } from "../../common/auth/auth.types";
import { CreateInvoiceDraftSchema, InvoiceListQuerySchema } from "./dto/invoice.schemas";
import { InvoicesService } from "./invoices.service";

@Controller("invoices")
@Audit({ entityType: "invoice", idParam: "id" })
export class InvoicesController {
  constructor(private invoices: InvoicesService) { }

  @Post("draft")
  @RequirePerm("voucher.draft.create")
  createDraft(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(CreateInvoiceDraftSchema)) body: any
  ) {
    return this.invoices.createDraft(user, body);
  }

  @Post(":id/draft")
  @RequirePerm("voucher.draft.update")
  updateDraft(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(CreateInvoiceDraftSchema)) body: any
  ) {
    return this.invoices.updateDraft(user, id, body);
  }

  @Post("preview")
  @RequirePerm("voucher.preview")
  preview(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(CreateInvoiceDraftSchema)) body: any
  ) {
    return this.invoices.preview(user, body);
  }

  @Post(":id/post")
  @RequirePerm("voucher.post")
  post(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.invoices.post(user, id);
  }

  @Post(":id/void")
  @RequirePerm("voucher.void")
  void(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.invoices.void(user, id);
  }

  @Get()
  @RequirePerm("voucher.preview")
  list(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(InvoiceListQuerySchema)) query: any
  ) {
    return this.invoices.list(user, query);
  }

  @Get(":id")
  @RequirePerm("voucher.preview")
  getById(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.invoices.getById(user, id);
  }
}
