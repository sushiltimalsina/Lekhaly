import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { Audit } from "../../common/audit/audit.decorator";
import { CurrentUser, RequirePerm } from "../../common/auth/auth.decorator";
import { ZodValidationPipe } from "../../common/zod/zod.pipe";
import type { AuthUser } from "../../common/auth/auth.types";
import { CreatePurchaseOrderSchema, PurchaseOrderListQuerySchema } from "./dto/purchase-order.schemas";
import { PurchaseOrdersService } from "./purchase-orders.service";
import { PurchaseOrderStatus } from "@prisma/client";

@Controller("/purchase-orders")
@Audit({ entityType: "purchase-order", idParam: "id" })
export class PurchaseOrdersController {
    constructor(private readonly purchaseOrders: PurchaseOrdersService) { }

    @Post()
    @RequirePerm("voucher.draft.create")
    create(
        @CurrentUser() user: AuthUser,
        @Body(new ZodValidationPipe(CreatePurchaseOrderSchema)) body: any
    ) {
        return this.purchaseOrders.create(user, body);
    }

    @Get()
    @RequirePerm("voucher.view")
    list(
        @CurrentUser() user: AuthUser,
        @Query(new ZodValidationPipe(PurchaseOrderListQuerySchema)) query: any
    ) {
        return this.purchaseOrders.list(user, query);
    }

    @Get(":id")
    @RequirePerm("voucher.view")
    getById(@CurrentUser() user: AuthUser, @Param("id") id: string) {
        return this.purchaseOrders.getById(user, id);
    }

    @Post(":id/cancel")
    @RequirePerm("voucher.void")
    cancel(@CurrentUser() user: AuthUser, @Param("id") id: string) {
        return this.purchaseOrders.cancel(user, id);
    }

    @Post(":id/convert-to-purchase")
    @RequirePerm("voucher.draft.create")
    convertToPurchase(@CurrentUser() user: AuthUser, @Param("id") id: string) {
        return this.purchaseOrders.convertToPurchase(user, id);
    }
}
