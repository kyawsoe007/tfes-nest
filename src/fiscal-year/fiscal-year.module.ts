import { Module } from '@nestjs/common';
import { FiscalYearService } from './fiscal-year.service';
import { FiscalYearController } from './fiscal-year.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { FiscalYearSchema } from './schemas/fiscal-year.schema';

@Module({
  imports:[
    MongooseModule.forFeature([
      {name:'FiscalYear',schema:FiscalYearSchema}
    ]),
  ],
  controllers: [FiscalYearController],
  providers: [FiscalYearService],
  exports:[FiscalYearService]
})
export class FiscalYearModule {}
