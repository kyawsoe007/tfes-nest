import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { BomsService } from './boms.service';
import { BomsController } from './boms.controller';
import { BomSchema } from './schemas/boms.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Bom', schema: BomSchema }])],
  controllers: [BomsController],
  providers: [BomsService],
  exports: [BomsService],
})
export class BomsModule {}
