import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { Audit } from "../../common/audit/audit.decorator";
import { CurrentUser, RequirePerm, RequireStep } from "../../common/auth/auth.decorator";
import { ZodValidationPipe } from "../../common/zod/zod.pipe";
import type { AuthUser } from "../../common/auth/auth.types";
import { PdfInvoiceSchema, PdfLedgerSchema } from "./dto/pdf.schemas";
import { PdfService } from "./pdf.service";

@Controller("pdf")
@Audit({ entityType: "pdf", idParam: "id" })
export class PdfController {
  constructor(private pdf: PdfService) {}

  @Post("invoice/:invoiceId")
  @RequirePerm("export.pdf")
  @RequireStep("sensitive")
  createInvoiceJob(
    @CurrentUser() user: AuthUser,
    @Param("invoiceId") invoiceId: string
  ) {
    return this.pdf.createJob(user, "invoice", { invoiceId });
  }

  @Post("voucher/:voucherId")
  @RequirePerm("export.pdf")
  @RequireStep("sensitive")
  createVoucherJob(
    @CurrentUser() user: AuthUser,
    @Param("voucherId") voucherId: string
  ) {
    return this.pdf.createJob(user, "voucher", { voucherId });
  }

  @Post("ledger")
  @RequirePerm("export.pdf")
  @RequireStep("sensitive")
  createLedgerJob(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(PdfLedgerSchema)) body: any
  ) {
    return this.pdf.createJob(user, "ledger", body);
  }

  @Get("jobs/:id")
  @RequirePerm("export.pdf")
  getJob(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.pdf.getJob(user, id);
  }

  @Get("jobs/:id/url")
  @RequirePerm("export.pdf")
  getJobUrl(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.pdf.getJobDownloadUrl(user, id);
  }
}
