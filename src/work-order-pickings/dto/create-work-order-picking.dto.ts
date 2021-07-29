import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Enum
export enum WoPickingStatusEnum {
  Open = 'open',
  Waiting = 'waiting',
  Processing = 'processing',
  Completed = 'completed',
  Cancelled = 'cancelled',
  Reserved = 'reserved',
}

// Base

export class CreateWorkOrderPickingDto {
  @ApiProperty({ description: 'Total quantity to work on' })
  workQty: number;

  @ApiProperty({ description: 'WorkOrderItem Id' })
  woItemId: string;

  @ApiProperty({ description: 'WorkOrder Id' })
  workOrderId: string;

  @ApiProperty({
    description:
      'optional, If does not contain bom Id, user should pass in selected sku Id',
  })
  skuId?: string;
  productId?: string;

  @ApiProperty({
    description: 'Selected sku id',
  })
  pickedSkuId: string;

  @ApiProperty()
  runningNum: number;

  @ApiProperty()
  checkConfirmWoItem?: boolean; // New Field for check box status

  _id?: string;
  partialCount?: number;
  woPickingId?: string; // virtual

  @ApiProperty({
    enum: [
      'open',
      'waiting',
      'processing',
      'completed',
      'cancelled',
      'reserved',
    ],
  })
  woPickingStatus: WoPickingStatusEnum;
}
