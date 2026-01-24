import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuditInterceptor } from "./common/audit/audit.interceptor";
import { PrismaModule } from "./common/prisma/prisma.module";
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
import { HealthModule } from "./moduls/health/health.module";
import { UnitsModule } from "./modules/units/units.module";

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    AuthModule,
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
    UnitsModule,
    AccountsModule
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_INTERCEPTOR, useClass: AuditInterceptor }]
})
export class AppModule {}
