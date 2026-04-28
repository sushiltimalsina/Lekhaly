import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { CurrentUser, RequirePerm } from "../../common/auth/auth.decorator";
import { ZodValidationPipe } from "../../common/zod/zod.pipe";
import type { AuthUser } from "../../common/auth/auth.types";
import { CreatePaymentMethodSchema, ListPaymentMethodQuerySchema } from "./dto/payment-methods.schemas";
import { PaymentMethodsService } from "./payment-methods.service";

@Controller("payment-methods")
export class PaymentMethodsController {
  constructor(private svc: PaymentMethodsService) {}

  @Post()
  @RequirePerm("masters.write")
  create(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(CreatePaymentMethodSchema)) body: any) {
    return this.svc.create(user, body);
  }

  @Get()
  @RequirePerm("masters.read")
  list(@CurrentUser() user: AuthUser, @Query(new ZodValidationPipe(ListPaymentMethodQuerySchema)) query: any) {
    return this.svc.list(user, query);
  }
}
