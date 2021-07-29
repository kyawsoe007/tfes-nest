import { Module } from '@nestjs/common';
import { BillingCurrencyService } from './billing-currency.service';
import { BillingCurrencyController } from './billing-currency.controller';
import { BillingCurrencySchema } from './schemas/billing-currency.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'BillingCurrency', schema: BillingCurrencySchema },
    ]),
  ],
  controllers: [BillingCurrencyController],
  providers: [BillingCurrencyService],
})
export class BillingCurrencyModule {}
