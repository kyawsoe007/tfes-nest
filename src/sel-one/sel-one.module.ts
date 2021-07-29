import { Module } from '@nestjs/common';
import { SelOneService } from './sel-one.service';
import { SelOneController } from './sel-one.controller';
import { MongooseModule } from '@nestjs/mongoose'; // Added this line
import { SelOneSchema } from './schemas/sel-one.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'SelOne', schema: SelOneSchema }]),
  ],
  controllers: [SelOneController],
  providers: [SelOneService],
  exports: [SelOneService],
})
export class SelOneModule {}
