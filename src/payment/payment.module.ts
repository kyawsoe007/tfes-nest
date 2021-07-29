import {forwardRef, Module} from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose'; // Added new line
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PaymentSchema } from './schemas/payment.schema';
import { InvoicesModule } from 'src/invoices/invoices.module';
import { ReconcileModule } from 'src/reconcile/reconcile.module';
import { CreditNoteModule } from 'src/credit-note/credit-note.module';
import { DebitNoteModule } from 'src/debit-note/debit-note.module';
import { SupplierInvoiceModule } from 'src/supplier-invoice/supplier-invoice.module';
import { SequenceSettingsModule } from 'src/sequence-settings/sequence-settings.module';
import { JournalEntryModule } from 'src/journal-entry/journal-entry.module';
import { PaymentMethodModule } from 'src/payment-method/payment-method.module';
import { AccountItemModule } from 'src/account-item/account-item.module';
import { PaymentDepositModule } from 'src/payment-deposits/payment-deposit.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Payment', schema: PaymentSchema },
    ]),
    SequenceSettingsModule,
    CreditNoteModule,
    DebitNoteModule,
    forwardRef(() => InvoicesModule),
    forwardRef(() => SupplierInvoiceModule),
    forwardRef(() => ReconcileModule),
    forwardRef(() => PaymentDepositModule),
    JournalEntryModule,
    PaymentMethodModule,
    AccountItemModule
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
