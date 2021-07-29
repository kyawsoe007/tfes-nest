import { ApiProperty } from '@nestjs/swagger';
export class CreateDeliveryWorkItemDto {
  @ApiProperty()
  woItemId: string;

  @ApiProperty()
  deliveryId: string;

  @ApiProperty()
  qty: number;

  @ApiProperty()
  initialQty: number;

  @ApiProperty()
  workOrderId: string;

  @ApiProperty()
  partialCount?: number;

  @ApiProperty()
  isClosed: boolean;
}
