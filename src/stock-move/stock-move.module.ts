import { MongooseModule } from '@nestjs/mongoose';
import { Module, forwardRef } from '@nestjs/common';
import { StockMoveService } from './stock-move.service';
import { StockMoveController } from './stock-move.controller';
import { StockMoveSchema } from './schemas/stock-move.schema';
import { StockOperationModule } from '../stock-operation/stock-operation.module';
import { ProductsModule } from '../products/products.module';
import { PurchasesModule } from '../purchase-order/purchase-order.module';
import { SkusModule } from '../skus/skus.module';
import { AccountJournalModule } from '../account-journal/account-journal.module';
import { PaymentTermsModule } from '../payment-terms/payment-terms.module';
import { TaxesModule } from '../taxes/taxes.module';
import { CurrenciesModule } from '../currencies/currencies.module';
import { AccountItemModule } from '../account-item/account-item.module';
import { JournalEntryModule } from '../journal-entry/journal-entry.module';
import { SalesOrdersModule } from '../sales-orders/sales-orders.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'StockMove', schema: StockMoveSchema }]),
    forwardRef(() => StockOperationModule),
    forwardRef(() => ProductsModule),
    forwardRef(() => PurchasesModule),
    forwardRef(() => SalesOrdersModule),
    forwardRef(() => SkusModule),
    AccountJournalModule,
    PaymentTermsModule,
    CurrenciesModule,
    AccountItemModule,
    JournalEntryModule,
    TaxesModule,
  ],
  controllers: [StockMoveController],
  providers: [StockMoveService],
  exports: [StockMoveService],
})
export class StockMoveModule {}
