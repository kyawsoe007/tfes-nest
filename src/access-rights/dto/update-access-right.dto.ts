import { PartialType } from '@nestjs/mapped-types';
import { CreateAccessRightDto } from './create-access-right.dto';

export class UpdateAccessRightDto extends PartialType(CreateAccessRightDto) {}
