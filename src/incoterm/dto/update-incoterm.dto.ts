import { PartialType } from '@nestjs/mapped-types';
import { CreateIncotermDto } from './create-incoterm.dto';

export class UpdateIncotermDto extends PartialType(CreateIncotermDto) {}
