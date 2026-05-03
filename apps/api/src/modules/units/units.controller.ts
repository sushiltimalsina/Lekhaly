import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CurrentUser, RequirePerm } from "../../common/auth/auth.decorator";
import { ZodValidationPipe } from "../../common/zod/zod.pipe";
import type { AuthUser } from "../../common/auth/auth.types";
import { CreateUnitSchema, ListUnitQuerySchema, ReorderSchema } from "./dto/unit.schemas";
import { UnitsService } from "./units.service";

@Controller("units")
export class UnitsController {
  constructor(private units: UnitsService) {}

  @Post()
  @RequirePerm("masters.write")
  create(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(CreateUnitSchema)) body: any) {
    return this.units.create(user, body);
  }

  @Patch("reorder")
  @RequirePerm("masters.write")
  reorder(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(ReorderSchema)) body: any) {
    return this.units.updateSortOrder(user, body);
  }

  @Patch(":id")
  @RequirePerm("masters.write")
  update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body(new ZodValidationPipe(CreateUnitSchema)) body: any) {
    return this.units.update(user, id, body);
  }

  @Get()
  @RequirePerm("masters.read")
  list(@CurrentUser() user: AuthUser, @Query(new ZodValidationPipe(ListUnitQuerySchema)) query: any) {
    return this.units.list(user, query);
  }

  @Delete(":id")
  @RequirePerm("masters.write")
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.units.remove(user, id);
  }
}
