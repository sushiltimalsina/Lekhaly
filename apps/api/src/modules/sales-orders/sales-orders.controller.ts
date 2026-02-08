import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { Audit } from "../../common/audit/audit.decorator";
import { CurrentUser, RequirePerm } from "../../common/auth/auth.decorator";
import { ZodValidationPipe } from "../../common/zod/zod.pipe";
import type { AuthUser } from "../../common/auth/auth.types";
import { CreateSalesOrderSchema, SalesOrderListQuerySchema } from "./dto/sales-order.schemas";
import { SalesOrdersService } from "./sales-orders.service";

@Controller("/sales-orders")
@Audit({ entityType: "sales-order", idParam: "id" })
export class SalesOrdersController {
    constructor(private salesOrders: SalesOrdersService) { }

    @Post()
    @RequirePerm("voucher.draft.create")
    create(
        @CurrentUser() user: AuthUser,
        @Body(new ZodValidationPipe(CreateSalesOrderSchema)) body: any
    ) {
        return this.salesOrders.create(user, body);
    }

    @Get()
    @RequirePerm("voucher.preview")
    list(
        @CurrentUser() user: AuthUser,
        @Query(new ZodValidationPipe(SalesOrderListQuerySchema)) query: any
    ) {
        return this.salesOrders.list(user, query);
    }

    @Get(":id")
    @RequirePerm("voucher.preview")
    getById(@CurrentUser() user: AuthUser, @Param("id") id: string) {
        return this.salesOrders.getById(user, id);
    }

    @Post(":id/cancel")
    @RequirePerm("voucher.void")
    cancel(@CurrentUser() user: AuthUser, @Param("id") id: string) {
        return this.salesOrders.cancel(user, id);
    }

    @Post(":id/convert-to-invoice")
    @RequirePerm("voucher.draft.create")
    convertToInvoice(@CurrentUser() user: AuthUser, @Param("id") id: string) {
        return this.salesOrders.convertToInvoice(user, id);
    }
}
