import { Module } from '@nestjs/common';
import { ProfitService } from './profit.service';
import { ProfitController } from './profit.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ProfitSchema } from './schemas/profit.schema';
import { AccountItemModule } from 'src/account-item/account-item.module';
import { CurrenciesModule } from 'src/currencies/currencies.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Profit', schema: ProfitSchema }]),
    AccountItemModule,
    CurrenciesModule
  ],
  controllers: [ProfitController],
  providers: [ProfitService],
  exports: [ProfitService]
})
export class ProfitModule { }
