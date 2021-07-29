import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose'; // Added new line
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { InvoiceSchema } from './schemas/invoices.schema';
import { SequenceSettingsModule } from 'src/sequence-settings/sequence-settings.module';
import { TaxesModule } from 'src/taxes/taxes.module';
import { PaymentTermsModule } from 'src/payment-terms/payment-terms.module';
import { CurrenciesModule } from 'src/currencies/currencies.module';
import { ReconcileModule } from 'src/reconcile/reconcile.module';
import { IncotermModule } from 'src/incoterm/incoterm.module';
import { ProductsModule } from 'src/products/products.module';
import { BomsModule } from 'src/boms/boms.module';
import { SkusModule } from 'src/skus/skus.module';
import { QuotationsModule } from 'src/quotations/quotations.module';
import { DiscountsModule } from 'src/discounts/discounts.module';
import { WorkOrdersModule } from 'src/work-orders/work-orders.module';
import { JournalEntryModule } from 'src/journal-entry/journal-entry.module';
import { AccountItemModule } from 'src/account-item/account-item.module';
import { StockMoveModule } from '../stock-move/stock-move.module';
import { FiscalPeriodModule } from 'src/fiscal-period/fiscal-period.module';
import { SalesOrdersModule } from 'src/sales-orders/sales-orders.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Invoice', schema: InvoiceSchema }]),
    SequenceSettingsModule,
    TaxesModule,
    AccountItemModule,
    PaymentTermsModule,
    CurrenciesModule,
    forwardRef(() => ReconcileModule),
    TaxesModule,
    BomsModule,
    ProductsModule,
    IncotermModule,
    SkusModule,
    QuotationsModule,
    DiscountsModule,
    WorkOrdersModule,
    JournalEntryModule,
    FiscalPeriodModule,
    forwardRef(() => SalesOrdersModule),
    UsersModule,
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
