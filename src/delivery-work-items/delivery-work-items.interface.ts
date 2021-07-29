import { Document } from 'mongoose';
export interface DeliveryWoItem extends Document {
  deliveryId: string;
  workOrderId: string;
  woItemId: string;
  qty: number;
  initialQty: number;
  isClosed: boolean;
  partialCount: number;
}
