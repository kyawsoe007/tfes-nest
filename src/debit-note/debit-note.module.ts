import {forwardRef, Module} from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose'; // Added new line
import { DebitNoteService } from './debit-note.service';
import { DebitNoteController } from './debit-note.controller';
import { DebitNoteSchema } from './schemas/debit-note.schema';
import { SequenceSettingsModule } from 'src/sequence-settings/sequence-settings.module';
import { TaxesModule } from 'src/taxes/taxes.module';
import { PaymentTermsModule } from 'src/payment-terms/payment-terms.module';
import { CurrenciesModule } from 'src/currencies/currencies.module';
import {  ReconcileModule } from 'src/reconcile/reconcile.module';
import { IncotermModule } from 'src/incoterm/incoterm.module';
import { ProductsModule } from 'src/products/products.module';
import { BomsModule } from 'src/boms/boms.module';
import { SkusModule } from 'src/skus/skus.module';
import { QuotationsModule } from 'src/quotations/quotations.module';
import { DiscountsModule } from 'src/discounts/discounts.module';
import { WorkOrdersModule } from 'src/work-orders/work-orders.module';
import { AccountItemModule } from 'src/account-item/account-item.module';
import { AccountJournalModule } from 'src/account-journal/account-journal.module';
import { JournalEntryModule } from 'src/journal-entry/journal-entry.module';
import { SalesOrdersModule } from 'src/sales-orders/sales-orders.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'DebitNote', schema: DebitNoteSchema },
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
    DiscountsModule,
    WorkOrdersModule,
    AccountItemModule,
    AccountJournalModule,
    JournalEntryModule,
    UsersModule
  ],
  controllers: [DebitNoteController],
  providers: [DebitNoteService],
  exports: [DebitNoteService],
})
export class DebitNoteModule {}
