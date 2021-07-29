import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose'; // Added new line
import { ReconcileService } from './reconcile.service';
import { ReconcileController } from './reconcile.controller';
import { ReconcileSchema } from './schemas/reconcile.schema';
import { InvoicesModule } from 'src/invoices/invoices.module';
import { SupplierInvoiceModule } from 'src/supplier-invoice/supplier-invoice.module';
import { CreditNoteModule } from 'src/credit-note/credit-note.module';
import { DebitNoteModule } from 'src/debit-note/debit-note.module';
import { PaymentModule } from 'src/payment/payment.module';
import { PaymentDepositModule } from 'src/payment-deposits/payment-deposit.module';
import { SequenceSettingsModule } from 'src/sequence-settings/sequence-settings.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Reconcile', schema: ReconcileSchema },
    ]),
    SequenceSettingsModule,
    forwardRef(() => InvoicesModule),
    forwardRef(() => SupplierInvoiceModule),
    forwardRef(() => PaymentModule),
    forwardRef(() => CreditNoteModule),
    forwardRef(() => DebitNoteModule),
    forwardRef(() => PaymentDepositModule)
  ],
  controllers: [ReconcileController],
  providers: [ReconcileService],
  exports: [ReconcileService],
})
export class ReconcileModule {}
