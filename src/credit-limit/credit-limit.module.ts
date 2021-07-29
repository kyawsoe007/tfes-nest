import { Module } from '@nestjs/common';
import { CreditLimitService } from './credit-limit.service';
import { CreditLimitController } from './credit-limit.controller';
import { MongooseModule } from '@nestjs/mongoose'; // Added this line
import { CreditLimitSchema } from './schemas/credit-limit.schema';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'CreditLimit', schema: CreditLimitSchema },
    ]),
  ],
  controllers: [CreditLimitController],
  providers: [CreditLimitService],
})
export class CreditLimitModule {}
