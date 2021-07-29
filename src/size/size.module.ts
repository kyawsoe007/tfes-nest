import { Module } from '@nestjs/common';
import { SizeService } from './size.service';
import { SizeController } from './size.controller';
import { SizeSchema } from './schemas/size.schema'; // Added this line
import { MongooseModule } from '@nestjs/mongoose'; // Added this line

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Size', schema: SizeSchema }])],
  controllers: [SizeController],
  providers: [SizeService],
  exports: [SizeService],
})
export class SizeModule {}
