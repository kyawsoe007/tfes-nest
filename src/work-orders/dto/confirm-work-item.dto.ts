export class ConfirmWoItemDto {
  _id?: string;
  workOrderId?: string;
  confirmQty: number; // New field for inserting qty
  workOrderItems?: ConfirmedWorkOrderItems;
}

// Nested Array Object
export class ConfirmedWorkOrderItems {
  _id?: string;
  woItemId: string;
  woItemStatus: string;
  runningNum: number;
  workType: string;
  qty: number;
  skuId?: string;
  productId?: string;
  description: string;
  pickedSkuId?: string;
  confirmQty?: number;
  latestQtyInput?: number;
  woPickingList?: any[];
}
