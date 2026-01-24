import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { CurrentUser, RequirePerm } from "../../common/auth/auth.decorator";
import { ZodValidationPipe } from "../../common/zod/zod.pipe";
import type { AuthUser } from "../../common/auth/auth.types";
import { CreateUnitSchema, ListUnitQuerySchema } from "./dto/unit.schemas";
import { UnitsService } from "./units.service";

@Controller("units")
export class UnitsController {
  constructor(private units: UnitsService) {}

  @Post()
  @RequirePerm("masters.write")
  create(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(CreateUnitSchema)) body: any) {
    return this.units.create(user, body);
  }

  @Get()
  @RequirePerm("masters.read")
  list(@CurrentUser() user: AuthUser, @Query(new ZodValidationPipe(ListUnitQuerySchema)) query: any) {
    return this.units.list(user, query);
  }
}

