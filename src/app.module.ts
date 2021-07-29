import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SalesOrdersModule } from './sales-orders/sales-orders.module';
import { InvoicesModule } from './invoices/invoices.module';
import { ReconcileModule } from './reconcile/reconcile.module';
import { PaymentModule } from './payment/payment.module';
import { PaymentTermsModule } from './payment-terms/payment-terms.module';
import { MongooseModule } from '@nestjs/mongoose';

import { ProductsModule } from './products/products.module';
import { IncotermModule } from './incoterm/incoterm.module';
import { BrandModule } from './brand/brand.module';
import { SizeModule } from './size/size.module';
import { CurrenciesModule } from './currencies/currencies.module';
import { SequenceSettingsModule } from './sequence-settings/sequence-settings.module';
import { PurchasesModule } from './purchase-order/purchase-order.module';
import { QuotationsModule } from './quotations/quotations.module';
import { GrpOneModule } from './grp-one/grp-one.module';
import { GrpTwoModule } from './grp-two/grp-two.module';
import { SelOneModule } from './sel-one/sel-one.module';
import { SelTwoModule } from './sel-two/sel-two.module';
import { MaterialModule } from './material/material.module';
import { UomModule } from './uom/uom.module';
import { GstReqModule } from './gst-req/gst-req.module';
import { CustomerModule } from './customer/customer.module';
import { SupplierModule } from './supplier/supplier.module';
import { DownPaymentModule } from './down-payment/down-payment.module';
import { CreditLimitModule } from './credit-limit/credit-limit.module';
import { CreditTermModule } from './credit-term/credit-term.module';
import { CountriesModule } from './countries/countries.module';
import { TaxesModule } from './taxes/taxes.module';
import { SkusModule } from './skus/skus.module';
import { BomsModule } from './boms/boms.module';
import { DiscountsModule } from './discounts/discounts.module';
import { WorkOrdersModule } from './work-orders/work-orders.module';
import { DeliveryOrdersModule } from './delivery-orders/delivery-orders.module';
import { PackingListsModule } from './packing-lists/packing-lists.module';
import { WorkOrderPickingsModule } from './work-order-pickings/work-order-pickings.module';
import { BillingCurrencyModule } from './billing-currency/billing-currency.module';
import { StockMoveModule } from './stock-move/stock-move.module';
import { StockOperationModule } from './stock-operation/stock-operation.module';
import { StockLocationModule } from './stock-location/stock-location.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AccessRolesModule } from './access-roles/access-roles.module';
import { AccessRightsModule } from './access-rights/access-rights.module';
import { SupplierInvoiceModule } from './supplier-invoice/supplier-invoice.module';
import { SupplierReconcileModule } from './supplier-reconcile/supplier-reconcile.module';
import { SupplierPaymentModule } from './supplier-payment/supplier-payment.module';
import { ApprovalRightsModule } from './approval-rights/approval-rights.module';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { AccountItemModule } from './account-item/account-item.module';
import { PartnersModule } from './partners/partners.module';
import { SaleTargetModule } from './sale-target/sale-target.module';
import { AccountJournalModule } from './account-journal/account-journal.module';
import { JournalEntryModule } from './journal-entry/journal-entry.module';
import { CreditNoteModule } from './credit-note/credit-note.module';
import { PaymentMethodModule } from './payment-method/payment-method.module';
import { FiscalYearModule } from './fiscal-year/fiscal-year.module';
import { DeliveryWorkItemsModule } from './delivery-work-items/delivery-work-items.module';
import { FiscalPeriodModule } from './fiscal-period/fiscal-period.module';
import { CapexManagementModule } from './capex-management/capex-management.module';
import { PurchaseSettingModule } from './purchase-setting/purchase-setting.module';
import { ReportsModule } from './reports/reports.module';
import { StockExpenseModule } from './stock-expense/stock-expense.module';
import { DebitNoteModule } from './debit-note/debit-note.module';
import { PaymentDepositModule } from './payment-deposits/payment-deposit.module';
import { LoanShortTermModule } from './loan-short-term/loan-short-term.module';
import { LoanLongTermModule } from './loan-long-term/loan-long-term.module';
import { PurchaseListTempModule } from './purchase-list-temp/purchase-list-temp.module';
import { UploadModule } from './upload/upload.module';
import { ProfitModule } from './profit/profit.module';
import { BalanceSheetModule } from './balance-sheet/balance-sheet.module';
import { ExpensesClaimModule } from './expenses-claim/expenses-claim.module';
import { EmployeeSettingModule } from './employee-setting/employee-setting.module';
import { LeaveManagementModule } from './leave-management/leave-management.module';

@Module({
  imports: [
    //   TypeOrmModule.forRoot({
    //   type: 'mongodb',
    //   host: 'localhost',
    //   port: 27017,
    //   username: 'root',
    //   password: '',
    //   database: 'everydaynest',
    //   synchronize: true,
    //   entities: [
    //     "dist/**/*.entity{.ts,.js}"
    //   ]
    // }),

    MongooseModule.forRoot('mongodb://localhost:27017/everydaynest', {
      useNewUrlParser: true,
      useFindAndModify: false,
      useCreateIndex: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api*'],
    }),
    // ServeStaticModule.forRoot({
    //   rootPath: join(__dirname,'..','uploads'),
    //   exclude: ['/api*'],
    // }),
    ProductsModule,
    IncotermModule,
    BrandModule,
    SizeModule,
    BillingCurrencyModule,
    SalesOrdersModule,
    InvoicesModule,
    ReconcileModule,
    PaymentModule,
    PaymentTermsModule,
    CurrenciesModule,
    SequenceSettingsModule,
    PurchasesModule,
    QuotationsModule,
    GrpOneModule,
    GrpTwoModule,
    SelOneModule,
    SelTwoModule,
    MaterialModule,
    UomModule,
    GstReqModule,
    CustomerModule,
    SupplierModule,
    DownPaymentModule,
    CreditLimitModule,
    CreditTermModule,
    CountriesModule,
    TaxesModule,
    SkusModule,
    BomsModule,
    DiscountsModule,
    WorkOrdersModule,
    DeliveryOrdersModule,
    PackingListsModule,
    WorkOrderPickingsModule,
    StockMoveModule,
    StockOperationModule,
    StockLocationModule,
    AuthModule,
    UsersModule,
    AccessRolesModule,
    AccessRightsModule,
    SupplierInvoiceModule,
    SupplierReconcileModule,
    SupplierPaymentModule,
    ApprovalRightsModule,
    AccountItemModule,
    PartnersModule,
    SaleTargetModule,
    AccountJournalModule,
    JournalEntryModule,
    CreditNoteModule,
    PaymentMethodModule,
    FiscalYearModule,
    DeliveryWorkItemsModule,
    FiscalPeriodModule,
    CapexManagementModule,
    PurchaseSettingModule,
    ReportsModule,
    StockExpenseModule,
    DebitNoteModule,
    PaymentDepositModule,
    LoanShortTermModule,
    LoanLongTermModule,
    PurchaseListTempModule,
    UploadModule,
    ProfitModule,
    BalanceSheetModule,
    ExpensesClaimModule,
    EmployeeSettingModule,
    LeaveManagementModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
