import { Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
import { CurrentUser, RequirePerm } from "../../common/auth/auth.decorator";
import { ZodValidationPipe } from "../../common/zod/zod.pipe";
import type { AuthUser } from "../../common/auth/auth.types";
import { StockQuerySchema } from "../inventory/dto/inventory.schemas";
import { CreateItemSchema, ListItemQuerySchema, UpdateItemSchema } from "./dto/item.schemas";
import { ItemsService } from "./items.service";
import { InventoryService } from "../inventory/inventory.service";

@Controller("items")
export class ItemsController {
  constructor(
    private items: ItemsService,
    private inventory: InventoryService
  ) {}

  @Post()
  @RequirePerm("masters.write")
  create(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(CreateItemSchema)) body: any) {
    return this.items.create(user, body);
  }

  @Put(":id")
  @RequirePerm("masters.write")
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateItemSchema)) body: any
  ) {
    return this.items.update(user, id, body);
  }

  @Get(":id")
  @RequirePerm("masters.read")
  get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.items.get(user, id);
  }

  @Get(":id/stock")
  @RequirePerm("masters.read")
  stock(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Query(new ZodValidationPipe(StockQuerySchema)) query: any
  ) {
    return this.inventory.getStock(user, id, query);
  }

  @Get()
  @RequirePerm("masters.read")
  list(@CurrentUser() user: AuthUser, @Query(new ZodValidationPipe(ListItemQuerySchema)) query: any) {
    return this.items.list(user, query);
  }

  @Delete(":id")
  @RequirePerm("masters.write")
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.items.remove(user, id);
  }

  @Post(":id/restore")
  @RequirePerm("masters.write")
  restore(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.items.restore(user, id);
  }

  @Post(":id/assemble")
  @RequirePerm("masters.write")
  assemble(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() body: { qty: number; memo?: string }
  ) {
    return this.items.assemble(user, id, body.qty, body.memo);
  }

  @Post(":id/disassemble")
  @RequirePerm("masters.write")
  disassemble(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() body: { qty: number }
  ) {
    return this.items.disassemble(user, id, body.qty);
  }
}
