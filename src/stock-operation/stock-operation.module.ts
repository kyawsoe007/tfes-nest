import { MongooseModule } from '@nestjs/mongoose';
import { forwardRef, Module } from '@nestjs/common';
import { StockOperationService } from './stock-operation.service';
import { StockOperationController } from './stock-operation.controller';
import { StockOperationSchema } from './schemas/stock-operation.schema';
import { SequenceSettingsModule } from '../sequence-settings/sequence-settings.module';
import { StockLocationModule } from '../stock-location/stock-location.module';
import { SkusModule } from '../skus/skus.module';
import { StockMoveModule } from 'src/stock-move/stock-move.module';
import { PurchasesModule } from '../purchase-order/purchase-order.module';
import { SalesOrdersModule } from '../sales-orders/sales-orders.module';
import { WorkOrdersModule } from '../work-orders/work-orders.module';
import { DeliveryOrdersModule } from '../delivery-orders/delivery-orders.module';
import { WorkOrderPickingsModule } from '../work-order-pickings/work-order-pickings.module';
import { AccountJournalModule } from '../account-journal/account-journal.module';
import { PaymentTermsModule } from '../payment-terms/payment-terms.module';
import { TaxesModule } from '../taxes/taxes.module';
import { CurrenciesModule } from '../currencies/currencies.module';
import { AccountItemModule } from '../account-item/account-item.module';
import { JournalEntryModule } from '../journal-entry/journal-entry.module';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'StockOperation', schema: StockOperationSchema },
    ]),
    SequenceSettingsModule,
    StockLocationModule,
    forwardRef(() => SkusModule),
    forwardRef(() => StockMoveModule),
    forwardRef(() => PurchasesModule),
    forwardRef(() => SalesOrdersModule),
    forwardRef(() => WorkOrdersModule),
    forwardRef(() => WorkOrderPickingsModule),
    forwardRef(() => DeliveryOrdersModule),
    AccountJournalModule,
    PaymentTermsModule,
    TaxesModule,
    CurrenciesModule,
    AccountItemModule,
    JournalEntryModule,
    forwardRef(() => ProductsModule),
  ],
  controllers: [StockOperationController],
  providers: [StockOperationService],
  exports: [StockOperationService],
})
export class StockOperationModule {}
