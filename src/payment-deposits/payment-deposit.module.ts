import {forwardRef, Module} from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose'; // Added new line
import { PaymentDepositService } from './payment-deposit.service';
import { PaymentDepositController } from './payment-deposit.controller';
import { PaymentDepositSchema } from './schemas/payment-deposit.schema';
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
import { AccountJournalModule } from 'src/account-journal/account-journal.module';
import { JournalEntryModule } from 'src/journal-entry/journal-entry.module';
import { SalesOrdersModule } from 'src/sales-orders/sales-orders.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'PaymentDeposit', schema: PaymentDepositSchema },
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
  controllers: [PaymentDepositController],
  providers: [PaymentDepositService],
  exports: [PaymentDepositService],
})
export class PaymentDepositModule {}
