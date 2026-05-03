import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from "@nestjs/common";
import { Audit } from "../../common/audit/audit.decorator";
import { CurrentUser, RequirePerm, RequireStep } from "../../common/auth/auth.decorator";
import { ZodValidationPipe } from "../../common/zod/zod.pipe";
import type { AuthUser } from "../../common/auth/auth.types";
import {
  AssignRoleUserSchema,
  CreateRoleSchema,
  RoleListQuerySchema,
  UpdateRoleSchema,
  ReorderSchema
} from "./dto/roles.schemas";
import { RolesService } from "./roles.service";

@Controller("roles")
@Audit({ entityType: "role", idParam: "id" })
export class RolesController {
  constructor(private roles: RolesService) {}

  @Get()
  @RequirePerm("settings.security")
  list(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(RoleListQuerySchema)) query: any
  ) {
    return this.roles.list(user, query);
  }

  @Patch("reorder")
  @RequirePerm("settings.security")
  reorder(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(ReorderSchema)) body: any) {
    return this.roles.updateSortOrder(user, body);
  }

  @Get("permissions")
  @RequirePerm("settings.security")
  permissions() {
    return this.roles.listPermissions();
  }

  @Get(":id")
  @RequirePerm("settings.security")
  getById(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.roles.getById(user, id);
  }

  @Post()
  @RequirePerm("settings.security")
  @RequireStep("sensitive")
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(CreateRoleSchema)) body: any
  ) {
    return this.roles.create(user, body);
  }

  @Put(":id")
  @RequirePerm("settings.security")
  @RequireStep("sensitive")
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateRoleSchema)) body: any
  ) {
    return this.roles.update(user, id, body);
  }

  @Delete(":id")
  @RequirePerm("settings.security")
  @RequireStep("sensitive")
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.roles.remove(user, id);
  }

  @Post(":id/users")
  @RequirePerm("settings.security")
  @RequireStep("sensitive")
  assignUser(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(AssignRoleUserSchema)) body: any
  ) {
    return this.roles.assignUser(user, id, body.userId);
  }

  @Delete(":id/users/:userId")
  @RequirePerm("settings.security")
  @RequireStep("sensitive")
  removeUser(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Param("userId") userId: string
  ) {
    return this.roles.removeUser(user, id, userId);
  }
}
