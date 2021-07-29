import { Module } from '@nestjs/common';
import { UomService } from './uom.service';
import { UomController } from './uom.controller';
import { UomSchema } from './schemas/uom.schema'; // Added this line
import { MongooseModule } from '@nestjs/mongoose'; // Added this line

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Uom', schema: UomSchema }])],
  controllers: [UomController],
  providers: [UomService],
  exports: [UomService],
})
export class UomModule {}
