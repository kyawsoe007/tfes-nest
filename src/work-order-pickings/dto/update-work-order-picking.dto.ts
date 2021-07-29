import { ApiProperty } from '@nestjs/swagger';
import { WoPickingStatusEnum } from './create-work-order-picking.dto';

export class UpdateWorkOrderPickingDto {
  @ApiProperty({ type: () => [WoPickingList] })
  woPickingList: WoPickingList[];
}

export class WoPickingList {
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
  skuId: string;

  @ApiProperty({
    description: 'Selected sku id',
  })
  pickedSkuId: string;

  @ApiProperty({
    description:
      'optional, If does contain bom Id, user should pass in selected Bom Array Object Id',
  })
  @ApiProperty()
  runningNum: number;

  productId?: string;

  _id?: string;
  checkConfirmWoItem?: boolean;
  partialCount?: number;
  woPickingId?: string; // virtual
  bomQtyInput?: number; // virtual

  woPickingStatus: WoPickingStatusEnum;
}
