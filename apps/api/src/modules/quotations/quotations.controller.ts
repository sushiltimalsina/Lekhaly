import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { Audit } from "../../common/audit/audit.decorator";
import { CurrentUser, RequirePerm } from "../../common/auth/auth.decorator";
import { ZodValidationPipe } from "../../common/zod/zod.pipe";
import type { AuthUser } from "../../common/auth/auth.types";
import { CreateQuotationSchema, QuotationListQuerySchema } from "./dto/quotation.schemas";
import { QuotationsService } from "./quotations.service";
import { QuotationStatus } from "@prisma/client";

@Controller("/quotations")
@Audit({ entityType: "quotation", idParam: "id" })
export class QuotationsController {
    constructor(private readonly quotations: QuotationsService) { }

    @Post()
    @RequirePerm("voucher.draft.create")
    create(
        @CurrentUser() user: AuthUser,
        @Body(new ZodValidationPipe(CreateQuotationSchema)) body: any
    ) {
        return this.quotations.create(user, body);
    }

    @Get()
    @RequirePerm("voucher.view")
    list(
        @CurrentUser() user: AuthUser,
        @Query(new ZodValidationPipe(QuotationListQuerySchema)) query: any
    ) {
        return this.quotations.list(user, query);
    }

    @Get(":id")
    @RequirePerm("voucher.view")
    getById(@CurrentUser() user: AuthUser, @Param("id") id: string) {
        return this.quotations.getById(user, id);
    }

    @Patch(":id/status")
    @RequirePerm("voucher.draft.update")
    updateStatus(
        @CurrentUser() user: AuthUser,
        @Param("id") id: string,
        @Body("status") status: QuotationStatus
    ) {
        return this.quotations.updateStatus(user, id, status);
    }

    @Post(":id/convert-to-sales-order")
    @RequirePerm("voucher.draft.create")
    convertToSalesOrder(@CurrentUser() user: AuthUser, @Param("id") id: string) {
        return this.quotations.convertToSalesOrder(user, id);
    }
}
