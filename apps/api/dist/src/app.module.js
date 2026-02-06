"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const audit_interceptor_1 = require("./common/audit/audit.interceptor");
const prisma_module_1 = require("./common/prisma/prisma.module");
const health_module_1 = require("./moduls/health/health.module");
const accounts_module_1 = require("./modules/accounts/accounts.module");
const auth_module_1 = require("./modules/auth/auth.module");
const audit_module_1 = require("./modules/audit/audit.module");
const outbox_module_1 = require("./modules/outbox/outbox.module");
const roles_module_1 = require("./modules/roles/roles.module");
const devices_module_1 = require("./modules/devices/devices.module");
const items_module_1 = require("./modules/items/items.module");
const banking_module_1 = require("./modules/banking/banking.module");
const parties_module_1 = require("./modules/parties/parties.module");
const reports_module_1 = require("./modules/reports/reports.module");
const sync_module_1 = require("./modules/sync/sync.module");
const vouchers_module_1 = require("./modules/vouchers/vouchers.module");
const users_module_1 = require("./modules/users/users.module");
const invoices_module_1 = require("./modules/invoices/invoices.module");
const inventory_module_1 = require("./modules/inventory/inventory.module");
const expenses_module_1 = require("./modules/expenses/expenses.module");
const taxes_module_1 = require("./modules/taxes/taxes.module");
const pdf_module_1 = require("./modules/pdf/pdf.module");
const units_module_1 = require("./modules/units/units.module");
const item_groups_module_1 = require("./modules/item-groups/item-groups.module");
const bill_sundries_module_1 = require("./modules/bill-sundries/bill-sundries.module");
const sales_orders_module_1 = require("./modules/sales-orders/sales-orders.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            sales_orders_module_1.SalesOrdersModule,
            health_module_1.HealthModule,
            auth_module_1.AuthModule,
            reports_module_1.ReportsModule,
            vouchers_module_1.VouchersModule,
            sync_module_1.SyncModule,
            audit_module_1.AuditModule,
            outbox_module_1.OutboxModule,
            roles_module_1.RolesModule,
            devices_module_1.DevicesModule,
            banking_module_1.BankingModule,
            users_module_1.UsersModule,
            invoices_module_1.InvoicesModule,
            inventory_module_1.InventoryModule,
            expenses_module_1.ExpensesModule,
            taxes_module_1.TaxesModule,
            pdf_module_1.PdfModule,
            parties_module_1.PartiesModule,
            items_module_1.ItemsModule,
            item_groups_module_1.ItemGroupsModule,
            units_module_1.UnitsModule,
            accounts_module_1.AccountsModule,
            bill_sundries_module_1.BillSundriesModule
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService, { provide: core_1.APP_INTERCEPTOR, useClass: audit_interceptor_1.AuditInterceptor }]
    })
], AppModule);
//# sourceMappingURL=app.module.js.map