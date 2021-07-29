import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { StockLocationService } from './stock-location.service';
import { StockLocationController } from './stock-location.controller';
import { StockLocationSchema } from './schemas/stock-location.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'StockLocation', schema: StockLocationSchema },
    ]),
  ],
  controllers: [StockLocationController],
  providers: [StockLocationService],
  exports: [StockLocationService],
})
export class StockLocationModule {}
