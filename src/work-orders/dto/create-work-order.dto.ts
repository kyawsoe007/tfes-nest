import { ApiProperty } from '@nestjs/swagger';
import { WoPickingList } from '../../work-order-pickings/dto/update-work-order-picking.dto';

// Enum
enum WoStatusEnum {
  Open = 'open',
  Waiting = 'waiting',
  Processing = 'processing',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

// Base
export class CreateWorkOrderDto {
  @ApiProperty({ enum: ['open', 'waiting', 'processing', 'completed'] })
  woStatus: WoStatusEnum;
  soNumber: string;
  description: string;
  completedDate: Date;

  @ApiProperty({ type: () => [WorkOrderItemsDto] })
  workOrderItems: WorkOrderItemsDto[];
  allRowData: any[];
}

// Nested Array Object
export class WorkOrderItemsDto {
  woItemId: string;
  workType: string;

  @ApiProperty({
    enum: ['open', 'waiting', 'processing', 'completed', 'cancelled'],
  })
  woItemStatus: WoStatusEnum;
  id: string;
  // doStatus: DeliveryStatusEnum;
  completedDate: Date;
  completedBy: string;
  runningNum: number;
  // isCreatedDo: boolean;

  qty: number;
  skuId: string;
  productId: string; // added new
  bom: string;
  picked: string; // not using
  description: string;
  product: any;
  remark: string;
  uom: string;
  confirmQty?: number;
  status: string;
  _id: string;

  @ApiProperty({ type: () => [WoPickingList] })
  woPickingList: WoPickingList[];
  some: any;
}
