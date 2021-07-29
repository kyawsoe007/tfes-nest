import { PartialType } from '@nestjs/mapped-types';
import { CreateSequenceSettingDto } from './create-sequence-setting.dto';

export class UpdateSequenceSettingDto extends PartialType(CreateSequenceSettingDto) {}
