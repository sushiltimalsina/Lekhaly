import { Body, Controller, Get, Patch, Post, Query } from "@nestjs/common";
import { CurrentUser, RequirePerm } from "../../common/auth/auth.decorator";
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

const ReorderSchema = z.array(
  z.object({
    id: z.string().uuid(),
    sortOrder: z.number().int(),
  }),
);

@Controller("purchase-types")
export class PurchaseTypesController {
  constructor(private svc: PurchaseTypesService) {}

  @Post()
  @RequirePerm("masters.write")
  create(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(CreatePurchaseTypeSchema)) body: any) {
    return this.svc.create(user, body);
  }

  @Patch("reorder")
  @RequirePerm("masters.write")
  reorder(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(ReorderSchema)) body: any) {
    return this.svc.updateSortOrder(user, body);
  }

  @Get()
  @RequirePerm("masters.read")
  list(@CurrentUser() user: AuthUser, @Query(new ZodValidationPipe(ListPurchaseTypeQuerySchema)) query: any) {
    return this.svc.list(user, query);
  }
}
