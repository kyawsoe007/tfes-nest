import { CurrenciesModule } from 'src/currencies/currencies.module';
import { PaymentMethodSchema } from './schemas/payment-method.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { PaymentMethodService } from './payment-method.service';
import { PaymentMethodController } from './payment-method.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name:'PaymentMethod',schema:PaymentMethodSchema}
    ]),
    CurrenciesModule,
  ],
  controllers: [PaymentMethodController],
  providers: [PaymentMethodService],
  exports:[PaymentMethodService]
})
export class PaymentMethodModule {}
