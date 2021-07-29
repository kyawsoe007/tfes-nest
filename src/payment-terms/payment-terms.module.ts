import { Module } from '@nestjs/common';
import { PaymentTermsService } from './payment-terms.service';
import { PaymentTermsController } from './payment-terms.controller';
import { MongooseModule } from '@nestjs/mongoose'; // Added new line
// import { TypeOrmModule } from '@nestjs/typeorm'; // added this line
// import { PaymentTermEntity } from './entities/payment-term.entity';
import { PaymentTermSchema } from './schemas/payment-terms.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'PaymentTerm', schema: PaymentTermSchema },
    ]),
  ], // added this line
  controllers: [PaymentTermsController],
  providers: [PaymentTermsService],
  exports: [PaymentTermsService],
})
export class PaymentTermsModule {}
