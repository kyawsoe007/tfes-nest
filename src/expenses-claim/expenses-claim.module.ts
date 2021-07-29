import { Module } from '@nestjs/common';
import { ExpensesClaimService } from './expenses-claim.service';
import { ExpensesClaimController } from './expenses-claim.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ExpensesClaimSchema } from './schemas/expenses-claim.schema';
import { SequenceSettingsModule } from '../sequence-settings/sequence-settings.module';
import { UsersModule } from '../users/users.module';
import { CurrenciesModule } from '../currencies/currencies.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'ExpensesClaim', schema: ExpensesClaimSchema },
    ]),
    SequenceSettingsModule,
    UsersModule,
    CurrenciesModule,
  ],
  controllers: [ExpensesClaimController],
  providers: [ExpensesClaimService],
  exports: [ExpensesClaimService],
})
export class ExpensesClaimModule {}
