import { Module } from "@nestjs/common";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuditInterceptor } from "./common/audit/audit.interceptor";
import { PrismaModule } from "./common/prisma/prisma.module";
import { HealthModule } from "./modules/health/health.module";
import { AccountsModule } from "./modules/accounts/accounts.module";
import { AuthModule } from "./modules/auth/auth.module";
import { AuditModule } from "./modules/audit/audit.module";
import { OutboxModule } from "./modules/outbox/outbox.module";
import { RolesModule } from "./modules/roles/roles.module";
import { DevicesModule } from "./modules/devices/devices.module";
import { ItemsModule } from "./modules/items/items.module";
import { BankingModule } from "./modules/banking/banking.module";
import { PartiesModule } from "./modules/parties/parties.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { SyncModule } from "./modules/sync/sync.module";
import { VouchersModule } from "./modules/vouchers/vouchers.module";
import { UsersModule } from "./modules/users/users.module";
import { InvoicesModule } from "./modules/invoices/invoices.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { ExpensesModule } from "./modules/expenses/expenses.module";
import { TaxesModule } from "./modules/taxes/taxes.module";
import { PdfModule } from "./modules/pdf/pdf.module";
import { UnitsModule } from "./modules/units/units.module";
import { ItemGroupsModule } from "./modules/item-groups/item-groups.module";
import { BillSundriesModule } from "./modules/bill-sundries/bill-sundries.module";
import { SalesOrdersModule } from "./modules/sales-orders/sales-orders.module";
import { QuotationsModule } from "./modules/quotations/quotations.module";
import { PurchaseOrdersModule } from "./modules/purchase-orders/purchase-orders.module";
import { ProformaModule } from "./modules/proforma/proforma.module";
import { FiscalSessionsModule } from "./modules/fiscal-sessions/fiscal-sessions.module";
import { PaymentMethodsModule } from "./modules/payment-methods/payment-methods.module";
import { SaleTypesModule } from "./modules/sale-types/sale-types.module";
import { PurchaseTypesModule } from "./modules/purchase-types/purchase-types.module";

@Module({
  imports: [
    // Rate limiting — 60 requests per 60 seconds per IP
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 60,
    }]),
    PrismaModule,
    HealthModule,
    AuthModule,
    SalesOrdersModule,
    QuotationsModule,
    PurchaseOrdersModule,
    ReportsModule,
    VouchersModule,
    SyncModule,
    AuditModule,
    OutboxModule,
    RolesModule,
    DevicesModule,
    BankingModule,
    UsersModule,
    InvoicesModule,
    InventoryModule,
    ExpensesModule,
    TaxesModule,
    PdfModule,
    PartiesModule,
    ItemsModule,
    ItemGroupsModule,
    UnitsModule,
    AccountsModule,
    BillSundriesModule,
    ProformaModule,
    FiscalSessionsModule,
    PaymentMethodsModule,
    SaleTypesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ]
})
export class AppModule { }
