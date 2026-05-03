import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CurrentUser, RequirePerm } from "../../common/auth/auth.decorator";
import { ZodValidationPipe } from "../../common/zod/zod.pipe";
import type { AuthUser } from "../../common/auth/auth.types";
import { CreateItemGroupSchema, ListItemGroupQuerySchema, ReorderSchema } from "./dto/item-group.schemas";
import { ItemGroupsService } from "./item-groups.service";

@Controller("item-groups")
export class ItemGroupsController {
  constructor(private groups: ItemGroupsService) {}

  @Post()
  @RequirePerm("masters.write")
  create(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(CreateItemGroupSchema)) body: any) {
    return this.groups.create(user, body);
  }

  @Patch("reorder")
  @RequirePerm("masters.write")
  reorder(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(ReorderSchema)) body: any) {
    return this.groups.updateSortOrder(user, body);
  }

  @Patch(":id")
  @RequirePerm("masters.write")
  update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body(new ZodValidationPipe(CreateItemGroupSchema)) body: any) {
    return this.groups.update(user, id, body);
  }

  @Get()
  @RequirePerm("masters.read")
  list(@CurrentUser() user: AuthUser, @Query(new ZodValidationPipe(ListItemGroupQuerySchema)) query: any) {
    return this.groups.list(user, query);
  }

  @Delete(":id")
  @RequirePerm("masters.write")
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.groups.remove(user, id);
  }
}

