import { Module } from '@nestjs/common';
import { GrpTwoService } from './grp-two.service';
import { GrpTwoController } from './grp-two.controller';
import { MongooseModule } from '@nestjs/mongoose'; // Added this line
import { GrpTwoSchema } from './schemas/grp-two.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'GrpTwo', schema: GrpTwoSchema }]),
  ],
  controllers: [GrpTwoController],
  providers: [GrpTwoService],
  exports: [GrpTwoService],
})
export class GrpTwoModule {}
