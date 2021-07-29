import { ReconcileModule } from 'src/reconcile/reconcile.module';
import { SupplierInvoiceModule } from './../supplier-invoice/supplier-invoice.module';
import { InvoicesModule } from 'src/invoices/invoices.module';
import { SupplierPaymentSchema } from './schemas/supplier-payment.schema';
import { SupplierPaymentService } from './supplier-payment.service';
import { SupplierPaymentController } from './supplier-payment.controller';
import {forwardRef, Module} from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose'; // Added new line
import { SequenceSettingsModule } from 'src/sequence-settings/sequence-settings.module';
import { AccountItemModule } from 'src/account-item/account-item.module';
import { JournalEntryModule } from 'src/journal-entry/journal-entry.module';
import { PaymentMethodModule } from 'src/payment-method/payment-method.module';
import { DebitNoteModule } from 'src/debit-note/debit-note.module';
import { CreditNoteModule } from 'src/credit-note/credit-note.module';
import { PaymentDepositModule } from 'src/payment-deposits/payment-deposit.module';
import { LoanShortTermModule } from 'src/loan-short-term/loan-short-term.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'SupplierPayment', schema: SupplierPaymentSchema },
    ]),
    SequenceSettingsModule,
    forwardRef(() => SupplierInvoiceModule),
    forwardRef(() => InvoicesModule),
    forwardRef(() => ReconcileModule),
    forwardRef(() => DebitNoteModule),
    forwardRef(() => CreditNoteModule),
    forwardRef(() => PaymentDepositModule),
    forwardRef(() => LoanShortTermModule),
    JournalEntryModule,
    PaymentMethodModule,
    AccountItemModule
  ],
  controllers: [SupplierPaymentController],
  providers: [SupplierPaymentService],
  exports: [SupplierPaymentService],
})
export class SupplierPaymentModule {}
