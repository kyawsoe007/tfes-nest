import { Module } from '@nestjs/common';
import { SaleTargetService } from './sale-target.service';
import { SaleTargetController } from './sale-target.controller';
import { MongooseModule } from '@nestjs/mongoose'; // Added new line
import { SaleTarget } from './schemas/sale-target.schema';
import { SalesOrdersModule } from 'src/sales-orders/sales-orders.module';
import { QuotationsModule } from 'src/quotations/quotations.module';
import { InvoicesModule } from '../invoices/invoices.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'SaleTarget', schema: SaleTarget }]),
    SalesOrdersModule,
    QuotationsModule,
    InvoicesModule,
  ],
  controllers: [SaleTargetController],
  providers: [SaleTargetService],
  exports: [SaleTargetService],
})
export class SaleTargetModule {}
