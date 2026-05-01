import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from "@nestjs/common";
import { StockCountsService } from "./stock-counts.service";
import { createStockCountSchema, updateStockCountSchema } from "./dto/stock-count.dto";
import { CurrentUser } from "../../common/auth/auth.decorator";
import type { AuthUser } from "../../common/auth/auth.types";
import { ZodValidationPipe } from "../../common/zod/zod.pipe";

@Controller("inventory/stock-counts")
export class StockCountsController {
  constructor(private readonly stockCountsService: StockCountsService) {}

  @Get()
  async list(@CurrentUser() user: AuthUser, @Query() query: any) {
    return this.stockCountsService.list(user.companyId, query);
  }

  @Get(":id")
  async get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.stockCountsService.getById(user.companyId, id);
  }

  @Post()
  async create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createStockCountSchema)) dto: any
  ) {
    return this.stockCountsService.create(user.companyId, user.sub, dto);
  }

  @Patch(":id")
  async update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateStockCountSchema)) dto: any
  ) {
    return this.stockCountsService.update(user.companyId, id, dto);
  }

  @Post(":id/complete")
  async complete(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() body: { adjustmentAccountId: string }
  ) {
    return this.stockCountsService.complete(user.companyId, id, body.adjustmentAccountId);
  }

  @Delete(":id")
  async delete(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.stockCountsService.delete(user.companyId, id);
  }
}
