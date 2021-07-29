import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Optional } from '@nestjs/common';

export enum DeliveryStatusEnum {
  Draft = 'draft',
  Confirmed = 'confirmed',
  Closed = 'closed', // become Closed
  Rescheduled = 'rescheduled',
  Partial = 'partial',
  Completed = 'completed',
}
export enum DeliveryLineStatusEnum {
  Open = 'open', // when open, workItem block from creating
  Confirmed = 'confirmed',
  Completed = 'completed',
  Cancelled = 'cancelled',
  Partial = 'partial',

  // no confirmed
}
export class CreateDeliveryOrderDto {
  // @ApiProperty()
  deliveryNumber: string;

  //@ApiProperty({ enum: ['Draft', 'Confirmed', 'Completed', 'Rescheduled'] })
  deliveryStatus: DeliveryStatusEnum;

  @ApiProperty()
  deliveryDate: Date;

  soNumber: string;

  operationId: string;

  @ApiProperty()
  timeRange: string;

  @ApiProperty()
  soDelRemark: string;

  @ApiProperty()
  timeDelivery: string;

  @ApiProperty()
  orderId: string;

  // @ApiProperty()
  customerId: string;

  @ApiProperty()
  deliveryAddress: string;

  @ApiProperty()
  remark: string;

  @ApiProperty()
  driver: string;

  @ApiProperty()
  workOrderId: string;

  // @ApiProperty({type:()=>DeliveryLines})

  @ValidateNested({ each: true })
  @ApiProperty({ type: () => [DeliveryLines] })
  deliveryLines: DeliveryLines[];
}

export class DeliveryLines {
  //  deliveryLineId: string;

  @ApiProperty()
  qty: number;

  @ApiProperty()
  deliveryLineNum: number;

  @ApiProperty()
  deliveryQty: number;

  // @ApiProperty({ enum: ['Open', 'Comfirmed', 'Completed', 'Cancelled'] })
  deliveryLinesStatus: DeliveryLineStatusEnum;

  // packingItemId: string;

  // packNumber: number;
  @ApiProperty()
  woItemId: string;

  @ApiProperty()
  sku?: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  uom: string;

  @ApiProperty()
  productId: string;
  _id: string;
  bom?: string;

  @ApiProperty()
  balanceQty: number;

  partialCount: number; // For DO Item Model
  latestQtyInput: number;

  // @ApiProperty()
  stockMove: string;
}
