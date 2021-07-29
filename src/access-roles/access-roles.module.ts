import { Module } from '@nestjs/common';
import { AccessRolesService } from './access-roles.service';
import { AccessRolesController } from './access-roles.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AccessRoleSchema } from './schemas/access-roles.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'AccessRole', schema: AccessRoleSchema },
    ]),
  ],
  controllers: [AccessRolesController],
  providers: [AccessRolesService],
  exports: [AccessRolesService],
})
export class AccessRolesModule {}
