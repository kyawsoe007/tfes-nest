import { Module } from '@nestjs/common';
import { BalanceSheetService } from './balance-sheet.service';
import { BalanceSheetController } from './balance-sheet.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { BalanceSheetSchema } from './schemas/balance-sheet.schema';
import { AccountItemModule } from 'src/account-item/account-item.module';
import { CurrenciesModule } from 'src/currencies/currencies.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'BalanceSheet', schema: BalanceSheetSchema }
    ]),
    AccountItemModule,
    CurrenciesModule
  ],
  controllers: [BalanceSheetController],
  providers: [BalanceSheetService],
  exports: [BalanceSheetService]
})
export class BalanceSheetModule { }
