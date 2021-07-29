import { Module } from '@nestjs/common';
import { StockExpenseService } from './stock-expense.service';
import { StockExpenseController } from './stock-expense.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { StockExpenseSchema } from './schemas/stock-expense.schema';
import { UsersModule } from 'src/users/users.module';
import { SkusModule } from 'src/skus/skus.module';
import { ProductsModule } from 'src/products/products.module';
import { StockOperationModule } from 'src/stock-operation/stock-operation.module';
import { StockLocationModule } from 'src/stock-location/stock-location.module';

@Module({
  imports:[
    MongooseModule.forFeature([
      { name: 'StockExpense', schema:StockExpenseSchema}
    ]),
    UsersModule,
    StockOperationModule,
    StockLocationModule,
    SkusModule,
    ProductsModule
  ],
  controllers: [StockExpenseController],
  providers: [StockExpenseService],
  exports:[StockExpenseService],
})
export class StockExpenseModule {}
