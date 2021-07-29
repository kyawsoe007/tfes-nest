import { CurrenciesModule } from 'src/currencies/currencies.module';
import { AccountJournalSchema } from './schemas/account-journal.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { AccountJournalService } from './account-journal.service';
import { AccountJournalController } from './account-journal.controller';
import { AccountItemModule } from 'src/account-item/account-item.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name:'AccountJournal',schema:AccountJournalSchema}
    ]),
    CurrenciesModule,
    AccountItemModule
  ],
  controllers: [AccountJournalController],
  providers: [AccountJournalService],
  exports:[AccountJournalService]
})
export class AccountJournalModule {}
