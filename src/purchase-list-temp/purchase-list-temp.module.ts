import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PurchaseListTempController } from './purchase-list-temp.controller';
import { PurchaseListTempService } from './purchase-list-temp.service';
import { PurchaseListTempSchema } from './schemas/purchase-list-temp.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'PurchaseListTemp', schema: PurchaseListTempSchema },
    ]),
  ],
  controllers: [PurchaseListTempController],
  providers: [PurchaseListTempService],
  exports: [PurchaseListTempService],
})
export class PurchaseListTempModule {}
