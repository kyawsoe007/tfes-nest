import { Module } from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { SupplierController } from './supplier.controller';
import { MongooseModule } from '@nestjs/mongoose'; // Added this line
import { SupplierSchema } from './schemas/supplier.schema';
import { IncotermSchema } from 'src/incoterm/schemas/incoterm.schema';
import { DownPaymentSchema } from 'src/down-payment/schemas/down-payment.schema';
import { GstreqSchema } from 'src/gst-req/schemas/gst-req.schema';
import { SequenceSettingsModule } from 'src/sequence-settings/sequence-settings.module';
import { CountrySchema } from './../countries/schemas/countries.schema';
import { UserSchema } from './../users/schemas/users.schema';
import { PartnersModule } from '../partners/partners.module';
import { CurrenciesModule } from 'src/currencies/currencies.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Supplier', schema: SupplierSchema }]),
    MongooseModule.forFeature([{ name: 'Incoterm', schema: IncotermSchema }]),
    MongooseModule.forFeature([
      { name: 'DownPayment', schema: DownPaymentSchema },
    ]),
    MongooseModule.forFeature([{ name: 'GstReq', schema: GstreqSchema }]),
    MongooseModule.forFeature([{ name: 'Country', schema: CountrySchema }]),
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    CurrenciesModule,
    SequenceSettingsModule,
    PartnersModule,
  ],
  controllers: [SupplierController],
  providers: [SupplierService],
  exports: [SupplierService]
})
export class SupplierModule {}
