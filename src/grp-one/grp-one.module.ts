import { Module } from '@nestjs/common';
import { GrpOneService } from './grp-one.service';
import { GrpOneController } from './grp-one.controller';
import { MongooseModule } from '@nestjs/mongoose'; // Added this line
import { GrpOneSchema } from './schemas/grp-one.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'GrpOne', schema: GrpOneSchema }]),
  ],
  controllers: [GrpOneController],
  providers: [GrpOneService],
  exports: [GrpOneService],
})
export class GrpOneModule {}
