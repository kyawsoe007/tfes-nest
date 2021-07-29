import { Document } from 'mongoose';

export interface WorkOrderPicking extends Document {
  readonly woItemId?: string;
  readonly workOrderId?: string;
  readonly skuId?: string;
  readonly productId?: string;
  pickedSkuId?: string;
  runningNum?: number;
  woPickingStatus?: string;
  workQty?: number;
  checkConfirmWoItem?: boolean;
  partialCount?: number;
  bomQtyInput?: number;
  _id: string;
  // For generating report

  productDesc?: string; // pdf
  partNumber?: string; // pdf
  selectedSkuPartNumber?: string; // pdf
  selectedSkuDescription?: string; // pdf
  selectedSkuLocation?: string; // pdf
  filter?: any;
  reduce?: any;
  pickedProduct?: string; // virtual
}
