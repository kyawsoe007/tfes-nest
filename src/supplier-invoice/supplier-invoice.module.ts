import {forwardRef, Module} from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose'; // Added new line
import { SupplierInvoiceService } from './supplier-invoice.service';
import { SupplierInvoiceController } from './supplier-invoice.controller';
import { SupplierInvoiceSchema } from './schemas/supplier-invoice.schema';
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
import { AccountItemModule } from 'src/account-item/account-item.module';
import { JournalEntryModule } from 'src/journal-entry/journal-entry.module';
import { AccountJournalModule } from 'src/account-journal/account-journal.module';
import { PurchaseSettingModule } from 'src/purchase-setting/purchase-setting.module';
import { SupplierModule } from 'src/supplier/supplier.module';
import { StockMoveModule } from '../stock-move/stock-move.module';
import { PurchasesModule } from '../purchase-order/purchase-order.module';
import { ExpensesClaimModule } from '../expenses-claim/expenses-claim.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'SupplierInvoice', schema: SupplierInvoiceSchema },
    ]),
    SequenceSettingsModule,
    TaxesModule,
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
    AccountItemModule,
    AccountJournalModule,
    JournalEntryModule,
    PurchaseSettingModule,
    SupplierModule,
    PurchasesModule,
    ExpensesClaimModule,
  ],
  controllers: [SupplierInvoiceController],
  providers: [SupplierInvoiceService],
  exports: [SupplierInvoiceService],
})
export class SupplierInvoiceModule {}
