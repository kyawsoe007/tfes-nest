import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { MongooseModule } from '@nestjs/mongoose'; // Added this line
import { CustomerSchema } from './schemas/customer.schema';
import { IncotermSchema } from 'src/incoterm/schemas/incoterm.schema';
import { GstreqSchema } from 'src/gst-req/schemas/gst-req.schema';
import { DownPaymentSchema } from 'src/down-payment/schemas/down-payment.schema';
import { CreditLimitSchema } from 'src/credit-limit/schemas/credit-limit.schema';
import { CreditTermSchema } from 'src/credit-term/schemas/credit-term.schema';
import { PaymentTermSchema } from 'src/payment-terms/schemas/payment-terms.schema';
import { CurrencySchema } from 'src/currencies/schemas/currencies.schema';
import { SequenceSettingsModule } from 'src/sequence-settings/sequence-settings.module';
import { CountrySchema } from './../countries/schemas/countries.schema';
import { UsersModule } from '../users/users.module';
import { PartnersModule } from '../partners/partners.module';
import { CurrenciesModule } from 'src/currencies/currencies.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Customer', schema: CustomerSchema }]),
    MongooseModule.forFeature([{ name: 'Incoterm', schema: IncotermSchema }]),
    MongooseModule.forFeature([{ name: 'GstReq', schema: GstreqSchema }]),
    MongooseModule.forFeature([
      { name: 'DownPayment', schema: DownPaymentSchema },
    ]),
    MongooseModule.forFeature([
      { name: 'CreditLimit', schema: CreditLimitSchema },
    ]),
    MongooseModule.forFeature([
      { name: 'CreditTerm', schema: CreditTermSchema },
    ]),
    MongooseModule.forFeature([
      { name: 'PaymentTerm', schema: PaymentTermSchema },
    ]),
    MongooseModule.forFeature([{ name: 'Country', schema: CountrySchema }]),
    SequenceSettingsModule,
    UsersModule,
    PartnersModule,
    CurrenciesModule,
  ],
  controllers: [CustomerController],
  providers: [CustomerService],
  exports: [CustomerService],
})
export class CustomerModule {}
