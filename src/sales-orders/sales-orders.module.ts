import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose'; // Added new line
import { SalesOrdersService } from './sales-orders.service';
import { SalesOrdersController } from './sales-orders.controller';
import { SalesOrderSchema } from './schemas/sales-orders.schema';
import { SequenceSettingsModule } from '../sequence-settings/sequence-settings.module';
import { PaymentTermsModule } from '../payment-terms/payment-terms.module';
import { CurrenciesModule } from '../currencies/currencies.module';
import { TaxesModule } from '../taxes/taxes.module';
import { BomsModule } from '../boms/boms.module';
import { ProductsModule } from '../products/products.module';
import { IncotermModule } from '../incoterm/incoterm.module';
import { SkusModule } from '../skus/skus.module';
import { QuotationsModule } from '../quotations/quotations.module';
import { DiscountsModule } from '../discounts/discounts.module';
import { WorkOrdersModule } from '../work-orders/work-orders.module';
import { UsersModule } from '../users/users.module';
import { UomModule } from '../uom/uom.module';
import { PurchasesModule } from '../purchase-order/purchase-order.module';
import { StockLocationModule } from '../stock-location/stock-location.module';
import { WorkOrderPickingsModule } from '../work-order-pickings/work-order-pickings.module';
import { PurchaseListTempModule } from '../purchase-list-temp/purchase-list-temp.module';
import { InvoicesModule } from '../invoices/invoices.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'SalesOrder', schema: SalesOrderSchema },
    ]),
    SequenceSettingsModule,
    TaxesModule,
    PaymentTermsModule,
    CurrenciesModule,
    TaxesModule,
    BomsModule,
    ProductsModule,
    IncotermModule,
    SkusModule,
    QuotationsModule,
    DiscountsModule,
    WorkOrdersModule,
    UsersModule,
    UomModule,
    PurchasesModule,
    StockLocationModule,
    WorkOrderPickingsModule,
    PurchaseListTempModule,
    InvoicesModule,
  ],
  controllers: [SalesOrdersController],
  providers: [SalesOrdersService],
  exports: [SalesOrdersService],
})
export class SalesOrdersModule {}
