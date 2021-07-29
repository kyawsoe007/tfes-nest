import { PartialType } from '@nestjs/mapped-types';
import { CreateSelTwoDto } from './create-sel-two.dto';

export class UpdateSelTwoDto extends PartialType(CreateSelTwoDto) {}
