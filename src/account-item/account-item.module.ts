import { CurrenciesModule } from 'src/currencies/currencies.module';
import { AccountItemSchema } from './schemas/account-item.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { AccountItemService } from './account-item.service';
import { AccountItemController } from './account-item.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name:'AccountItem',schema:AccountItemSchema}
    ]),
  CurrenciesModule,
  ],
  controllers: [AccountItemController],
  providers: [AccountItemService],
  exports:[AccountItemService]
})
export class AccountItemModule {}
