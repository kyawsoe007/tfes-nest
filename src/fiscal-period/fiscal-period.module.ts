import { Module } from '@nestjs/common';
import { FiscalPeriodService } from './fiscal-period.service';
import { FiscalPeriodController } from './fiscal-period.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { FiscalPeriodSchema } from './schemas/fiscal-period.schema';
import { FiscalYearModule } from 'src/fiscal-year/fiscal-year.module';

@Module({
  imports:[
    MongooseModule.forFeature([
      {name:'FiscalPeriod',schema:FiscalPeriodSchema}
    ]),
    FiscalYearModule
  ],
  controllers: [FiscalPeriodController],
  providers: [FiscalPeriodService],
  exports:[FiscalPeriodService]
})
export class FiscalPeriodModule {}
