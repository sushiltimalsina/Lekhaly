import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { CurrentUser } from "../../common/auth/auth.decorator";
import type { AuthUser } from "../../common/auth/auth.types";
import { ZodValidationPipe } from "../../common/zod/zod.pipe";
import { z } from "zod";
import { PurchaseTypesService } from "./purchase-types.service";

const CreatePurchaseTypeSchema = z.object({
  name: z.string().min(1),
  isActive: z.boolean().optional(),
});

const ListPurchaseTypeQuerySchema = z.object({
  isActive: z.enum(["true", "false"]).optional(),
  take: z.string().transform(Number).optional(),
});

@Controller("purchase-types")
@UseGuards(JwtAuthGuard)
export class PurchaseTypesController {
  constructor(private svc: PurchaseTypesService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(CreatePurchaseTypeSchema)) body: any) {
    return this.svc.create(user, body);
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query(new ZodValidationPipe(ListPurchaseTypeQuerySchema)) query: any) {
    return this.svc.list(user, query);
  }
}
