import { Body, Controller, Get, Patch, Post, Query } from "@nestjs/common";
import { CurrentUser, RequirePerm } from "../../common/auth/auth.decorator";
import { ZodValidationPipe } from "../../common/zod/zod.pipe";
import type { AuthUser } from "../../common/auth/auth.types";
import { CreateSaleTypeSchema, ListSaleTypeQuerySchema, ReorderSchema } from "./dto/sale-types.schemas";
import { SaleTypesService } from "./sale-types.service";

@Controller("sale-types")
export class SaleTypesController {
  constructor(private svc: SaleTypesService) {}

  @Post()
  @RequirePerm("masters.write")
  create(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(CreateSaleTypeSchema)) body: any) {
    return this.svc.create(user, body);
  }

  @Patch("reorder")
  @RequirePerm("masters.write")
  reorder(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(ReorderSchema)) body: any) {
    return this.svc.updateSortOrder(user, body);
  }

  @Get()
  @RequirePerm("masters.read")
  list(@CurrentUser() user: AuthUser, @Query(new ZodValidationPipe(ListSaleTypeQuerySchema)) query: any) {
    return this.svc.list(user, query);
  }
}
