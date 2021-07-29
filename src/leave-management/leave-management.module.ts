import { Module } from '@nestjs/common';
import { LeaveManagementService } from './leave-management.service';
import { LeaveManagementController } from './leave-management.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { LeaveManagementSchema } from './schemas/leave-management.schema';
import { SequenceSettingsModule } from 'src/sequence-settings/sequence-settings.module';
import { EmployeeSettingModule } from 'src/employee-setting/employee-setting.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'LeaveManagement', schema: LeaveManagementSchema },

    ]),
    SequenceSettingsModule,
    EmployeeSettingModule,
    UsersModule
  ],
  controllers: [LeaveManagementController],
  providers: [LeaveManagementService],
  exports: [LeaveManagementService]
})
export class LeaveManagementModule { }
