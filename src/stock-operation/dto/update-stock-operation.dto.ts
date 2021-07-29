import { PartialType } from '@nestjs/mapped-types';
import { CreateStockOperationDto } from './create-stock-operation.dto';

export class UpdateStockOperationDto extends PartialType(
  CreateStockOperationDto,
) {}
