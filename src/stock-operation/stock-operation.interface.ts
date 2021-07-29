import { Document } from 'mongoose';

export interface StockOperation extends Document {
  moveNo: string;
  type: string;
  orderNo: string;
  destination: string;
  status: string;
  createdDate: string;
  expectedDate: string;
  completedDate: string;
  deliveryId: string;
  onMoveIn?: boolean;
  onSelectProduct?: boolean;
}
