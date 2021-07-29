import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { TaxesService } from './taxes.service';
import { TaxesController } from './taxes.controller';
import { TaxSchema } from './schemas/taxes.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Tax', schema: TaxSchema }])],
  controllers: [TaxesController],
  providers: [TaxesService],
  exports: [TaxesService],
})
export class TaxesModule {}
