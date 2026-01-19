import { Body, Controller, Delete, Get, Headers, Param, Post, Put, Query } from "@nestjs/common";
import { Audit } from "../../common/audit/audit.decorator";
import { CurrentUser, RequirePerm, RequireStep } from "../../common/auth/auth.decorator";
import { ZodValidationPipe } from "../../common/zod/zod.pipe";
import type { AuthUser } from "../../common/auth/auth.types";
import { CreateVoucherAttachmentSchema } from "./dto/attachment.schemas";
import { CreateVoucherDraftSchema, ListVoucherQuerySchema, UpdateVoucherDraftSchema } from "./dto/voucher.schemas";
import { VouchersService } from "./vouchers.service";

@Controller("vouchers")
@Audit({ entityType: "voucher", idParam: "id" })
export class VouchersController {
  constructor(private vouchers: VouchersService) {}

  @Post("draft")
  @RequirePerm("voucher.draft.create")
  createDraft(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(CreateVoucherDraftSchema)) body: any,
    @Headers("Idempotency-Key") idempotencyKey?: string
  ) {
    return this.vouchers.createDraft(user, body, idempotencyKey);
  }

  @Put(":id/draft")
  @RequirePerm("voucher.draft.edit")
  updateDraft(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateVoucherDraftSchema)) body: any
  ) {
    return this.vouchers.updateDraft(user, id, body);
  }

  @Get(":id")
  @RequirePerm("voucher.preview")
  getById(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.vouchers.getById(user, id);
  }

  @Get(":id/preview")
  @RequirePerm("voucher.preview")
  preview(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.vouchers.preview(user, id);
  }

  @Get()
  @RequirePerm("voucher.preview")
  list(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(ListVoucherQuerySchema)) query: any
  ) {
    return this.vouchers.list(user, query);
  }

  @Get(":id/attachments")
  @RequirePerm("voucher.preview")
  listAttachments(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.vouchers.listAttachments(user, id);
  }

  @Get(":id/attachments/:attachmentId/url")
  @RequirePerm("voucher.preview")
  attachmentUrl(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Param("attachmentId") attachmentId: string
  ) {
    return this.vouchers.getAttachmentUrl(user, id, attachmentId);
  }

  @Post(":id/attachments")
  @RequirePerm("voucher.draft.edit")
  addAttachment(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(CreateVoucherAttachmentSchema)) body: any
  ) {
    return this.vouchers.addAttachment(user, id, body);
  }

  @Delete(":id/attachments/:attachmentId")
  @RequirePerm("voucher.draft.edit")
  removeAttachment(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Param("attachmentId") attachmentId: string
  ) {
    return this.vouchers.removeAttachment(user, id, attachmentId);
  }

  @Post(":id/post")
  @RequirePerm("voucher.post")
  @RequireStep("sensitive")
  post(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Headers("Idempotency-Key") idempotencyKey?: string
  ) {
    return this.vouchers.post(user, id, idempotencyKey);
  }

  @Post(":id/void")
  @RequirePerm("voucher.void")
  @RequireStep("sensitive")
  void(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Headers("Idempotency-Key") idempotencyKey?: string
  ) {
    return this.vouchers.void(user, id, idempotencyKey);
  }
}
