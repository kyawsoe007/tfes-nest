import { PartialType } from '@nestjs/mapped-types';
import { CreateSkusDto } from './create-skus.dto';

export class UpdateSkusDto extends PartialType(CreateSkusDto) {}
