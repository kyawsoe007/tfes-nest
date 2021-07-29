import { PartialType } from '@nestjs/mapped-types';
import { CreateWorkOrderPickingDto } from './create-work-order-picking.dto';

export class UpdateConfirmedWorkOrderPicking extends PartialType(
  CreateWorkOrderPickingDto,
) {}
