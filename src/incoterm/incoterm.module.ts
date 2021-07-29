import { Module } from '@nestjs/common';
import { IncotermService } from './incoterm.service';
import { IncotermController } from './incoterm.controller';
import { IncotermSchema } from './schemas/incoterm.schema'; // Added this line
import { MongooseModule } from '@nestjs/mongoose'; // Added this line

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Incoterm', schema: IncotermSchema }]),
  ],
  controllers: [IncotermController],
  providers: [IncotermService],
  exports: [IncotermService],
})
export class IncotermModule {}
