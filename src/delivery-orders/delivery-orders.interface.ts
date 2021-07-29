import { Document } from 'mongoose';

export interface DeliveryOrder extends Document {
  // base field
  deliveryDate: Date;
  deliveryStatus: DeliveryStatusEnum;
  deliveryNumber: string;
  timeRange: string;
  timeDelivery: string;
  deliveryAddress: string;
  orderId: string;
  customerId: string;
  remark: string;
  soNumber: string;
  customer?: string;
  driver: string;
  operationId?: string;
  deliveryLines: DeliveryLines[];
  workOrderId: string;
  soDelRemark: string;
  ciplNum?: string;
}

// Nested Array Object
export interface DeliveryLines {
  uomName?: string;
  set?: any;
  _id?: string;
  // set?: any;
  // deliveryLineId?: string;
  deliveryLineNum: number;
  productId?: string;
  sku?: string;
  deliveryQty?: number;
  description: string;
  deliveryLinesStatus: DeliveryLineStatusEnum;
  // packingItemId: string;
  qty: number;
  woItemId: string;
  // packNumber: number;
  stockMove?: string;
  bom?: string;
  uom?: string;
  custRef?: string;

  //balanceQty?: string;
}

// Enum
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
}

// DeliveryOrder object
export interface DeliveryOrderObject {
  orderId: string;
  deliveryLines: any;
  customerId: string;
  deliveryNumber: string;
  deliveryAddress: string;
  workOrderId: string;
  soDelRemark: string;
  ciplNum: string;
  soNumber: string;
}
