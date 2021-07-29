import { CreateDeliveryOrderDto } from './create-delivery-order.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateAllDeliveryOrderDto extends PartialType(
  CreateDeliveryOrderDto,
) {}
