import { CreateDeliveryOrderDto } from './create-delivery-order.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateDeliveryOrderDto extends PartialType(
  CreateDeliveryOrderDto,
) {}
