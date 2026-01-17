import { Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
import { CurrentUser, RequirePerm } from "../../common/auth/auth.decorator";
import { ZodValidationPipe } from "../../common/zod/zod.pipe";
import type { AuthUser } from "../../common/auth/auth.types";
import { CreatePartySchema, ListPartyQuerySchema, UpdatePartySchema } from "./dto/party.schemas";
import { PartiesService } from "./parties.service";

@Controller("parties")
export class PartiesController {
  constructor(private parties: PartiesService) {}

  @Post()
  @RequirePerm("masters.write")
  create(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(CreatePartySchema)) body: any) {
    return this.parties.create(user, body);
  }

  @Put(":id")
  @RequirePerm("masters.write")
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdatePartySchema)) body: any
  ) {
    return this.parties.update(user, id, body);
  }

  @Get(":id")
  @RequirePerm("masters.read")
  get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.parties.get(user, id);
  }

  @Get()
  @RequirePerm("masters.read")
  list(@CurrentUser() user: AuthUser, @Query(new ZodValidationPipe(ListPartyQuerySchema)) query: any) {
    return this.parties.list(user, query);
  }

  @Delete(":id")
  @RequirePerm("masters.write")
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.parties.remove(user, id);
  }
}
