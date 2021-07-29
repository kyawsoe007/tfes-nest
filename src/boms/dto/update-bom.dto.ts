import { PartialType } from '@nestjs/mapped-types';
import { CreateBomDto } from './create-bom.dto';

export class UpdateBomDto extends PartialType(CreateBomDto) {}
