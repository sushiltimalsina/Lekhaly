import { Body, Controller, Get, Param, Post, Put, Query } from "@nestjs/common";
import { Audit } from "../../common/audit/audit.decorator";
import { CurrentUser, RequirePerm, RequireStep } from "../../common/auth/auth.decorator";
import { ZodValidationPipe } from "../../common/zod/zod.pipe";
import type { AuthUser } from "../../common/auth/auth.types";
import { CreateUserSchema, UpdateUserSchema, UserListQuerySchema } from "./dto/users.schemas";
import { UsersService } from "./users.service";

@Controller("users")
@Audit({ entityType: "user", idParam: "id" })
export class UsersController {
  constructor(private users: UsersService) {}

  @Get()
  @RequirePerm("settings.users")
  list(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(UserListQuerySchema)) query: any
  ) {
    return this.users.list(user, query);
  }

  @Get(":id")
  @RequirePerm("settings.users")
  getById(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.users.getById(user, id);
  }

  @Post()
  @RequirePerm("settings.users")
  @RequireStep("sensitive")
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(CreateUserSchema)) body: any
  ) {
    return this.users.create(user, body);
  }

  @Put(":id")
  @RequirePerm("settings.users")
  @RequireStep("sensitive")
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateUserSchema)) body: any
  ) {
    return this.users.update(user, id, body);
  }
}
