import { Module } from '@nestjs/common';
import { CreditTermService } from './credit-term.service';
import { CreditTermController } from './credit-term.controller';
import { MongooseModule } from '@nestjs/mongoose'; // Added this line
import { CreditTermSchema } from './schemas/credit-term.schema';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'CreditTerm', schema: CreditTermSchema },
    ]),
  ],
  controllers: [CreditTermController],
  providers: [CreditTermService],
})
export class CreditTermModule {}
