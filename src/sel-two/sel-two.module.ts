import { Module } from '@nestjs/common';
import { SelTwoService } from './sel-two.service';
import { SelTwoController } from './sel-two.controller';
import { MongooseModule } from '@nestjs/mongoose'; // Added this line
import { SelTwoSchema } from './schemas/sel-two.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'SelTwo', schema: SelTwoSchema }]),
  ],
  controllers: [SelTwoController],
  providers: [SelTwoService],
  exports: [SelTwoService],
})
export class SelTwoModule {}
