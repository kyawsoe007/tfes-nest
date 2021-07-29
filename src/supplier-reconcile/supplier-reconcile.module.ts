import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose'; // Added new line
import { SupplierReconcileService } from './supplier-reconcile.service';
import { SupplierReconcileController } from './supplier-reconcile.controller';
import { SupplierReconcileSchema } from './schemas/supplier-reconcile.schema';
import { SupplierInvoiceModule } from './../supplier-invoice/supplier-invoice.module';
import { PaymentModule } from 'src/payment/payment.module';
import { DebitNoteModule } from 'src/debit-note/debit-note.module';
import { PaymentDepositModule } from 'src/payment-deposits/payment-deposit.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'SupplierReconcile', schema: SupplierReconcileSchema },
    ]),
    forwardRef(() => SupplierInvoiceModule),
    forwardRef(() => PaymentModule),
    forwardRef(() => DebitNoteModule),
    forwardRef(() => PaymentDepositModule)
  ],
  controllers: [SupplierReconcileController],
  providers: [SupplierReconcileService],
  exports: [SupplierReconcileService],
})
export class SupplierReconcileModule {}
