import { PartialType } from '@nestjs/mapped-types';
import { CreateDeliveryWorkItemDto } from './create-delivery-work-items.dto';

export class UpdateDeliveryWorkItemDto extends PartialType(
  CreateDeliveryWorkItemDto,
) {}
