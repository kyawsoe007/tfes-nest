import { PartialType } from '@nestjs/mapped-types';
import { CreateEmployeeSettingDto } from './create-employee-setting.dto';

export class UpdateEmployeeSettingDto extends PartialType(CreateEmployeeSettingDto) {}
