import { Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
import { CurrentUser, RequirePerm } from "../../common/auth/auth.decorator";
import { ZodValidationPipe } from "../../common/zod/zod.pipe";
import type { AuthUser } from "../../common/auth/auth.types";
import { CreateAccountSchema, ListAccountQuerySchema, UpdateAccountSchema } from "./dto/account.schemas";
import { AccountsService } from "./accounts.service";

@Controller("accounts")
export class AccountsController {
  constructor(private accounts: AccountsService) {}

  @Post()
  @RequirePerm("masters.write")
  create(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(CreateAccountSchema)) body: any) {
    return this.accounts.create(user, body);
  }

  @Put(":id")
  @RequirePerm("masters.write")
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateAccountSchema)) body: any
  ) {
    return this.accounts.update(user, id, body);
  }

  @Get(":id")
  @RequirePerm("masters.read")
  get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.accounts.get(user, id);
  }

  @Get()
  @RequirePerm("masters.read")
  list(@CurrentUser() user: AuthUser, @Query(new ZodValidationPipe(ListAccountQuerySchema)) query: any) {
    return this.accounts.list(user, query);
  }

  @Delete(":id")
  @RequirePerm("masters.write")
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.accounts.remove(user, id);
  }
}
