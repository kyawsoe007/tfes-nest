import { PartialType } from '@nestjs/mapped-types';
import { CreateSelOneDto } from './create-sel-one.dto';

export class UpdateSelOneDto extends PartialType(CreateSelOneDto) {}
