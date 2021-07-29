import { Module } from '@nestjs/common';
import { DeliveryWorkItemsService } from './delivery-work-items.service';
import { DeliveryWorkItemsController } from './delivery-work-items.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { DeliveryWoItemSchema } from './shemas/delivery-work-items.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'DeliveryWoItem', schema: DeliveryWoItemSchema },
    ]),
  ],
  controllers: [DeliveryWorkItemsController],
  providers: [DeliveryWorkItemsService],
  exports: [DeliveryWorkItemsService],
})
export class DeliveryWorkItemsModule {}
