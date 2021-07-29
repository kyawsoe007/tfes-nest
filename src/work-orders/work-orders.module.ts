import { MongooseModule } from '@nestjs/mongoose';
import { forwardRef, Module } from '@nestjs/common';
import { WorkOrdersService } from './work-orders.service';
import { WorkOrdersController } from './work-orders.controller';
import { WorkOrderSchema } from './schemas/work-orders.schema';
import { SequenceSettingsModule } from './../sequence-settings/sequence-settings.module';
import { BomsModule } from './../boms/boms.module';
import { SkusModule } from './../skus/skus.module';
import { UsersModule } from 'src/users/users.module';
import { ProductsModule } from './../products/products.module';
import { WorkOrderPickingsModule } from './../work-order-pickings/work-order-pickings.module';
import { SalesOrdersModule } from './../sales-orders/sales-orders.module';
import { PackingListsModule } from './../packing-lists/packing-lists.module';
import { DeliveryWorkItemsModule } from '../delivery-work-items/delivery-work-items.module';
import { StockOperationModule } from '../stock-operation/stock-operation.module';
import { DeliveryOrdersModule } from '../delivery-orders/delivery-orders.module';
import { JournalEntryModule } from '../journal-entry/journal-entry.module';
import { StockMoveModule } from '../stock-move/stock-move.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'WorkOrder', schema: WorkOrderSchema }]),
    SequenceSettingsModule,
    BomsModule,
    UsersModule,
    forwardRef(() => SkusModule),
    forwardRef(() => ProductsModule),
    WorkOrderPickingsModule,
    forwardRef(() => SalesOrdersModule),
    PackingListsModule,
    DeliveryWorkItemsModule,
    forwardRef(() => StockOperationModule),
    DeliveryOrdersModule,
    JournalEntryModule,
    forwardRef(() => StockMoveModule),
  ],
  controllers: [WorkOrdersController],
  providers: [WorkOrdersService],
  exports: [WorkOrdersService],
})
export class WorkOrdersModule {}
