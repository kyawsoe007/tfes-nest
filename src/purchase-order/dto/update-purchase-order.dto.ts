import { PartialType } from '@nestjs/mapped-types';
import { CreatePurchaseDto } from './create-purchase-order.dto';

export class UpdatePurchaseDto extends PartialType(CreatePurchaseDto) {}
