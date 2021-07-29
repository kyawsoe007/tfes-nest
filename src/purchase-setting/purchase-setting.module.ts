import { Module } from '@nestjs/common';
import { PurchaseSettingService } from './purchase-setting.service';
import { PurchaseSettingController } from './purchase-setting.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { PurchaseSettingSchema } from './schemas/purchase-setting.schema';
import { AccountItemModule } from 'src/account-item/account-item.module';

@Module({
  imports:[
    MongooseModule.forFeature([{name:'PurchaseSetting',schema:PurchaseSettingSchema}]),
    AccountItemModule
  ],
  controllers: [PurchaseSettingController],
  providers: [PurchaseSettingService],
  exports:[PurchaseSettingService]
})
export class PurchaseSettingModule {}
