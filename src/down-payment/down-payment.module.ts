import { Module } from '@nestjs/common';
import { DownPaymentService } from './down-payment.service';
import { DownPaymentController } from './down-payment.controller';
import { MongooseModule } from '@nestjs/mongoose'; // Added this line
import { DownPaymentSchema } from './schemas/down-payment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'DownPayment', schema: DownPaymentSchema },
    ]),
  ],
  controllers: [DownPaymentController],
  providers: [DownPaymentService],
  exports:[DownPaymentService],
})
export class DownPaymentModule {}
