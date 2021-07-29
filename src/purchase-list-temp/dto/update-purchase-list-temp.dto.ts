import { PartialType } from '@nestjs/mapped-types';
import { CreatePurchaseListTempDto } from './create-purchase-list-temp.dto';

export class UpdatePurchaseListTempDto extends PartialType(
  CreatePurchaseListTempDto,
) {}
