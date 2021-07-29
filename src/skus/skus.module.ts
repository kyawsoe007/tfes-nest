import { CurrenciesModule } from 'src/currencies/currencies.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { SkusService } from './skus.service';
import { SkusController } from './skus.controller';
import { SkuSchema } from './schemas/skus.schema';
import { GrpTwoModule } from 'src/grp-two/grp-two.module';
import { GrpOneModule } from 'src/grp-one/grp-one.module';
import { SelOneModule } from 'src/sel-one/sel-one.module';
import { BrandModule } from 'src/brand/brand.module';
import { UomModule } from 'src/uom/uom.module';
import { MaterialModule } from 'src/material/material.module';
import { SizeModule } from 'src/size/size.module';
import { SelTwoModule } from 'src/sel-two/sel-two.module';
import { StockLocationModule } from 'src/stock-location/stock-location.module';
import { SupplierModule } from '../supplier/supplier.module';
import { WorkOrdersModule } from '../work-orders/work-orders.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Sku', schema: SkuSchema }]),
    GrpOneModule,
    GrpTwoModule,
    SelOneModule,
    SelTwoModule,
    SizeModule,
    BrandModule,
    UomModule,
    MaterialModule,
    CurrenciesModule,
    StockLocationModule,
    SupplierModule,
    WorkOrdersModule,
  ],
  controllers: [SkusController],
  providers: [SkusService],
  exports: [SkusService],
})
export class SkusModule {}
