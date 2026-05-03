import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from "@nestjs/common";
import { Audit } from "../../common/audit/audit.decorator";
import { CurrentUser, RequirePerm } from "../../common/auth/auth.decorator";
import { ZodValidationPipe } from "../../common/zod/zod.pipe";
import type { AuthUser } from "../../common/auth/auth.types";
import { BillSundrySchema, BillSundryListQuerySchema, ReorderSchema } from "./dto/bill-sundry.schemas";
import { BillSundriesService } from "./bill-sundries.service";

@Controller("bill-sundries")
@Audit({ entityType: "bill-sundry", idParam: "id" })
export class BillSundriesController {
    constructor(private billSundries: BillSundriesService) { }

    @Get()
    @RequirePerm("manage.billSundries")
    list(
        @CurrentUser() user: AuthUser,
        @Query(new ZodValidationPipe(BillSundryListQuerySchema)) query: any
    ) {
        return this.billSundries.list(user, query);
    }

    @Patch("reorder")
    @RequirePerm("manage.billSundries")
    reorder(
        @CurrentUser() user: AuthUser,
        @Body(new ZodValidationPipe(ReorderSchema)) body: any
    ) {
        return this.billSundries.updateSortOrder(user, body);
    }

    @Post()
    @RequirePerm("manage.billSundries")
    create(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(BillSundrySchema)) body: any) {
        return this.billSundries.create(user, body);
    }

    @Get(":id")
    @RequirePerm("manage.billSundries")
    get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
        return this.billSundries.get(user, id);
    }

    @Put(":id")
    @RequirePerm("manage.billSundries")
    update(
        @CurrentUser() user: AuthUser,
        @Param("id") id: string,
        @Body(new ZodValidationPipe(BillSundrySchema)) body: any
    ) {
        return this.billSundries.update(user, id, body);
    }

    @Delete(":id")
    @RequirePerm("manage.billSundries")
    remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
        return this.billSundries.remove(user, id);
    }
}
