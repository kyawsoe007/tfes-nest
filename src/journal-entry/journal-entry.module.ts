import { CurrenciesModule } from 'src/currencies/currencies.module';
import { SequenceSettingsModule } from 'src/sequence-settings/sequence-settings.module';
import { JournalEntrySchema } from './schemas/journal-entry.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { JournalEntryService } from './journal-entry.service';
import { JournalEntryController } from './journal-entry.controller';
import { FiscalPeriodModule } from 'src/fiscal-period/fiscal-period.module';
import { AccountItemModule } from 'src/account-item/account-item.module';
import { TaxesModule } from 'src/taxes/taxes.module';
import { ProfitModule } from 'src/profit/profit.module';
import { BalanceSheetModule } from 'src/balance-sheet/balance-sheet.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name:'JournalEntry',schema:JournalEntrySchema}
    ]),
    CurrenciesModule,
    FiscalPeriodModule,
    SequenceSettingsModule,
    AccountItemModule,
    TaxesModule,
    ProfitModule,
    BalanceSheetModule
  ],
  controllers: [JournalEntryController],
  providers: [JournalEntryService],
  exports:[JournalEntryService]
})
export class JournalEntryModule {}
