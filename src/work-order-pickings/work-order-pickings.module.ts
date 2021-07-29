import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { WorkOrderPickingsService } from './work-order-pickings.service';
import { WorkOrderPickingsController } from './work-order-pickings.controller';
import { WorkOrderPickingSchema } from './schemas/work-order-pickings.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'WorkOrderPicking', schema: WorkOrderPickingSchema },
    ]),
  ],
  controllers: [WorkOrderPickingsController],
  providers: [WorkOrderPickingsService],
  exports: [WorkOrderPickingsService],
})
export class WorkOrderPickingsModule {}
