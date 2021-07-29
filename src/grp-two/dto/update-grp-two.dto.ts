import { PartialType } from '@nestjs/mapped-types';
import { CreateGrpTwoDto } from './create-grp-two.dto';

export class UpdateGrpTwoDto extends PartialType(CreateGrpTwoDto) {}
