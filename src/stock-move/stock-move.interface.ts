import { Document } from 'mongoose';

export interface StockMove extends Document {
  productId: string;
  operationId: string;
  lineNumber: number;
  description: string;
  destinationId: string;
  estimatedDate: Date;
  qty: number;
  unitPrice: number;
  remarks: string;
  done: boolean;
  completedQty: number;
  remainingQty: number;
  completedDate?: Date;
  originalMoveId: string;
  skuId: string;
  lineNumberId: string;
  arrivedQty?: number;
}
