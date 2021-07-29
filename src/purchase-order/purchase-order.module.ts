import { BomsModule } from './../boms/boms.module';
import { TaxesModule } from './../taxes/taxes.module';
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose'; // Added new line
import { PurchasesService } from './purchase-order.service';
import { PurchasesController } from './purchase-order.controller';
import { PurchaseSchema } from './schemas/purchase-order.schema';
import { SequenceSettingsModule } from 'src/sequence-settings/sequence-settings.module';
import { PaymentTermsModule } from 'src/payment-terms/payment-terms.module';
import { CurrenciesModule } from 'src/currencies/currencies.module';
import { IncotermModule } from 'src/incoterm/incoterm.module';
import { SkusModule } from 'src/skus/skus.module';
import { ProductsModule } from 'src/products/products.module';
import { DiscountsModule } from 'src/discounts/discounts.module';
import { UomModule } from '../uom/uom.module';
import { StockOperationModule } from 'src/stock-operation/stock-operation.module';
import { StockMoveModule } from 'src/stock-move/stock-move.module';
import { StockLocationModule } from 'src/stock-location/stock-location.module';
import { UsersModule } from '../users/users.module';
import { ApprovalRightsModule } from '../approval-rights/approval-rights.module';
import { PurchaseListTempModule } from '../purchase-list-temp/purchase-list-temp.module';
import { SupplierModule } from '../supplier/supplier.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Purchase', schema: PurchaseSchema }]),
    PaymentTermsModule,
    CurrenciesModule,
    IncotermModule,
    SequenceSettingsModule,
    TaxesModule,
    BomsModule,
    forwardRef(() => ProductsModule),
    forwardRef(() => SkusModule),
    DiscountsModule,
    UomModule,
    forwardRef(() => StockOperationModule),
    forwardRef(() => StockMoveModule),
    StockLocationModule,
    UsersModule,
    ApprovalRightsModule,
    PurchaseListTempModule,
    SupplierModule,
  ],
  controllers: [PurchasesController],
  providers: [PurchasesService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
