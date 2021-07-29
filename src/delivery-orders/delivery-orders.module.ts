import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DeliveryOrdersService } from './delivery-orders.service';
import { DeliveryOrdersController } from './delivery-orders.controller';
import { DeliveryOrderSchema } from './schemas/delivery-orders.schema';
import { SequenceSettingsModule } from '../sequence-settings/sequence-settings.module';
import { SalesOrdersModule } from '../sales-orders/sales-orders.module';
import { PackingListsModule } from '../packing-lists/packing-lists.module';
import { WorkOrderPickingsModule } from '../work-order-pickings/work-order-pickings.module';
import { WorkOrdersModule } from '../work-orders/work-orders.module';
import { UsersModule } from '../users/users.module';
import { UomModule } from '../uom/uom.module';
import { DeliveryWorkItemsModule } from '../delivery-work-items/delivery-work-items.module';
import { IncotermModule } from '../incoterm/incoterm.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'DeliveryOrder', schema: DeliveryOrderSchema },
    ]),
    SequenceSettingsModule,
    forwardRef(() => SalesOrdersModule),
    forwardRef(() => PackingListsModule),
    forwardRef(() => WorkOrderPickingsModule),
    forwardRef(() => WorkOrdersModule),
    UsersModule,
    UomModule,
    DeliveryWorkItemsModule,
    IncotermModule,
  ],
  controllers: [DeliveryOrdersController],
  providers: [DeliveryOrdersService],
  exports: [DeliveryOrdersService],
})
export class DeliveryOrdersModule {}
