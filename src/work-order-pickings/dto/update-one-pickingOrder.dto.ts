export class UpdateOneWoPickingDto {
  workQty?: number;
  woItemId?: string;
  workOrderId?: string;
  skuId?: string;
  productId?: string;
  pickedSkuId?: string;
  runningNum?: number;
  checkConfirmWoItem?: boolean; // New Field for check box status
  bomQtyInput?: number;
  _id?: string;
  partialCount?: number;
  woPickingId?: string; // virtual
  woPickingStatus?: string;
}
