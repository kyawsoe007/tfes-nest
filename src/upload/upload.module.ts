import { forwardRef, Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { MulterModule } from '@nestjs/platform-express';
import { MongooseModule } from '@nestjs/mongoose';
import { UploadSchema } from './schemas/upload.schema';
import { SalesOrdersModule } from 'src/sales-orders/sales-orders.module';
import { ExpensesClaimModule } from 'src/expenses-claim/expenses-claim.module';
import { QuotationsModule } from 'src/quotations/quotations.module';

@Module({
 imports:[MulterModule.register({
    dest:'./uploads'
  }),
  MongooseModule.forFeature([{name:'Upload',schema:UploadSchema}]),
  forwardRef(()=>SalesOrdersModule),
  forwardRef(()=>ExpensesClaimModule),
  forwardRef(()=>QuotationsModule)
],
  controllers: [UploadController],
  providers: [UploadService],
  exports:[UploadService]
})
export class UploadModule {}
