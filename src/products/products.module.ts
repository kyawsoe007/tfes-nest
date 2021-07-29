import { forwardRef, Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ProductsSchema } from './schemas/products.schema'; // Added this line
import { MongooseModule } from '@nestjs/mongoose'; // Added this line
import { BrandSchema } from 'src/brand/schemas/brand.schema';
import { SizeSchema } from 'src/size/schemas/size.schema';
import { GrpOneSchema } from 'src/grp-one/schemas/grp-one.schema';
import { GrpTwoSchema } from 'src/grp-two/schemas/grp-two.schema';
import { SelOneSchema } from 'src/sel-one/schemas/sel-one.schema';
import { SelTwoSchema } from 'src/sel-two/schemas/sel-two.schema';
import { UomSchema } from 'src/uom/schemas/uom.schema';
import { MaterialSchema } from 'src/material/schemas/material.schema';
import { GstreqSchema } from 'src/gst-req/schemas/gst-req.schema';
import { SupplierSchema } from 'src/supplier/schemas/supplier.schema';
import { SkusModule } from './../skus/skus.module';
import { CurrenciesModule } from 'src/currencies/currencies.module';
import { SequenceSettingsModule } from 'src/sequence-settings/sequence-settings.module';
import { StockLocationModule } from '../stock-location/stock-location.module';
import { BomsModule } from '../boms/boms.module';
import { SalesOrdersModule } from '../sales-orders/sales-orders.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Product', schema: ProductsSchema }]),
    MongooseModule.forFeature([{ name: 'Brand', schema: BrandSchema }]),
    MongooseModule.forFeature([{ name: 'GrpOne', schema: GrpOneSchema }]),
    MongooseModule.forFeature([{ name: 'GrpTwo', schema: GrpTwoSchema }]),
    MongooseModule.forFeature([{ name: 'GstReq', schema: GstreqSchema }]),
    MongooseModule.forFeature([{ name: 'SelOne', schema: SelOneSchema }]),
    MongooseModule.forFeature([{ name: 'SelTwo', schema: SelTwoSchema }]),
    MongooseModule.forFeature([{ name: 'Size', schema: SizeSchema }]),
    MongooseModule.forFeature([{ name: 'Supplier', schema: SupplierSchema }]),
    MongooseModule.forFeature([{ name: 'Uom', schema: UomSchema }]),
    MongooseModule.forFeature([{ name: 'Material', schema: MaterialSchema }]),
    CurrenciesModule,
    SkusModule,
    SequenceSettingsModule,
    StockLocationModule,
    BomsModule,
    forwardRef(() => SalesOrdersModule),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
