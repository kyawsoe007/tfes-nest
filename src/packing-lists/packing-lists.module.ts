import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PackingListSchema } from './schemas/packing-lists.schema';
import { PackingListsService } from './packing-lists.service';
import { PackingListsController } from './packing-lists.controller';
import { ProductsModule } from '../products/products.module';
import { SalesOrdersModule } from '../sales-orders/sales-orders.module';
import { DeliveryOrdersModule } from '../delivery-orders/delivery-orders.module';
import { UsersModule } from '../users/users.module';
import { IncotermModule } from '../incoterm/incoterm.module';
import { CurrenciesModule } from '../currencies/currencies.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'PackingList', schema: PackingListSchema },
    ]),
    forwardRef(() => ProductsModule),
    forwardRef(() => SalesOrdersModule),
    DeliveryOrdersModule,
    UsersModule,
    IncotermModule,
    CurrenciesModule,
  ],
  controllers: [PackingListsController],
  providers: [PackingListsService],
  exports: [PackingListsService],
})
export class PackingListsModule {}
