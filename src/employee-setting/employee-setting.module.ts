import { Module } from '@nestjs/common';
import { EmployeeSettingService } from './employee-setting.service';
import { EmployeeSettingController } from './employee-setting.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { EmployeeSettingSchema } from './schemas/employee-setting.schema';
import { SequenceSettingsModule } from 'src/sequence-settings/sequence-settings.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'EmployeeSetting', schema: EmployeeSettingSchema },

    ]),
    SequenceSettingsModule
  ],
  controllers: [EmployeeSettingController],
  providers: [EmployeeSettingService],
  exports: [EmployeeSettingService]
})
export class EmployeeSettingModule { }
