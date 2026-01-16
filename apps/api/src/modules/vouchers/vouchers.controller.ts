import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import { CurrentUser, RequirePerm, RequireStep } from "../../common/auth/auth.decorator";
import { ZodValidationPipe } from "../../common/zod/zod.pipe";
import type { AuthUser } from "../../common/auth/auth.types";
import { CreateVoucherDraftSchema, UpdateVoucherDraftSchema } from "./dto/voucher.schemas";
import { VouchersService } from "./vouchers.service";

@Controller("vouchers")
export class VouchersController {
  constructor(private vouchers: VouchersService) {}

  @Post("draft")
  @RequirePerm("voucher.draft.create")
  createDraft(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(CreateVoucherDraftSchema)) body: any
  ) {
    return this.vouchers.createDraft(user, body);
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

  @Post(":id/post")
  @RequirePerm("voucher.post")
  @RequireStep("sensitive")
  post(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.vouchers.post(user, id);
  }

  @Post(":id/void")
  @RequirePerm("voucher.void")
  @RequireStep("sensitive")
  void(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.vouchers.void(user, id);
  }
}
