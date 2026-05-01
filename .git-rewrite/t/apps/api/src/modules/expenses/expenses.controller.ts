import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { Audit } from "../../common/audit/audit.decorator";
import { CurrentUser, RequirePerm, RequireStep } from "../../common/auth/auth.decorator";
import { ZodValidationPipe } from "../../common/zod/zod.pipe";
import type { AuthUser } from "../../common/auth/auth.types";
import { ExpenseDraftSchema, ExpenseListQuerySchema } from "./dto/expenses.schemas";
import { ExpensesService } from "./expenses.service";

@Controller("expenses")
@Audit({ entityType: "expense", idParam: "id" })
export class ExpensesController {
  constructor(private expenses: ExpensesService) {}

  @Post("draft")
  @RequirePerm("voucher.draft.create")
  createDraft(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(ExpenseDraftSchema)) body: any
  ) {
    return this.expenses.createDraft(user, body);
  }

  @Post("preview")
  @RequirePerm("voucher.preview")
  preview(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(ExpenseDraftSchema)) body: any
  ) {
    return this.expenses.preview(user, body);
  }

  @Post(":id/post")
  @RequirePerm("voucher.post")
  @RequireStep("sensitive")
  post(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(ExpenseDraftSchema)) body: any
  ) {
    return this.expenses.post(user, id, body);
  }

  @Get()
  @RequirePerm("voucher.preview")
  list(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(ExpenseListQuerySchema)) query: any
  ) {
    return this.expenses.list(user, query);
  }
}
