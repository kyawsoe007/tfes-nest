import { Module } from '@nestjs/common';
import { GstReqService } from './gst-req.service';
import { GstReqController } from './gst-req.controller';
import { MongooseModule } from '@nestjs/mongoose'; // Added this line
import { GstreqSchema } from './schemas/gst-req.schema';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'GstReq', schema: GstreqSchema }]),
  ],
  controllers: [GstReqController],
  providers: [GstReqService],
  exports: [GstReqService],
})
export class GstReqModule {}
