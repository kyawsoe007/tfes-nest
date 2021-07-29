import { Module } from '@nestjs/common';
import { ApprovalRightsService } from './approval-rights.service';
import { ApprovalRightsController } from './approval-rights.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ApprovalRightSchema } from './schemas/approval-rights.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'ApprovalRight', schema: ApprovalRightSchema },
    ]),
    UsersModule,
  ],
  controllers: [ApprovalRightsController],
  providers: [ApprovalRightsService],
  exports: [ApprovalRightsService],
})
export class ApprovalRightsModule {}
