import { Document } from 'mongoose';
export interface PurchaseListTemp extends Document {
  salesOrderId: string;
  description: string;
  productId: string;
  sku: string;
  qty: number;
  isChecked: boolean;
  isLatest?: boolean; // for calculation
  isPoSubmitted?: boolean;
  suppName?: string;
}
