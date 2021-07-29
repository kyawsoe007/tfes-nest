import { Module } from '@nestjs/common';
import { LoanShortTermService } from './loan-short-term.service';
import { LoanShortTermController } from './loan-short-term.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { LoanShortTermSchema } from './schemas/loan-short-term.schema';
import { AccountItemModule } from 'src/account-item/account-item.module';
import { SupplierModule } from 'src/supplier/supplier.module';
import { JournalEntryModule } from 'src/journal-entry/journal-entry.module';
import { CurrenciesModule } from 'src/currencies/currencies.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'LoanShortTerm', schema: LoanShortTermSchema },
    ]),
    AccountItemModule,
    SupplierModule,
    JournalEntryModule,
    CurrenciesModule
  ],
  controllers: [LoanShortTermController],
  providers: [LoanShortTermService],
  exports: [LoanShortTermService],
})
export class LoanShortTermModule {}
