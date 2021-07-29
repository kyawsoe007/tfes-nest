import { PartialType } from '@nestjs/mapped-types';
import { CreateGrpOneDto } from './create-grp-one.dto';

export class UpdateGrpOneDto extends PartialType(CreateGrpOneDto) {}
