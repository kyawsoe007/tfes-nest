import { forwardRef, Module } from '@nestjs/common';
import { AccessRightsService } from './access-rights.service';
import { AccessRightsController } from './access-rights.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AccessRightSchema } from './schemas/access-rights.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'AccessRight', schema: AccessRightSchema },
    ]),
    forwardRef(() => UsersModule),
  ],
  controllers: [AccessRightsController],
  providers: [AccessRightsService],
  exports: [AccessRightsService],
})
export class AccessRightsModule {}
