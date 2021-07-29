import { PartialType } from '@nestjs/mapped-types';
import { CreateSaleTargetDto } from './create-sale-target.dto';

export class UpdateSaleTargetDto extends PartialType(CreateSaleTargetDto) {}
