import { Document } from 'mongoose';

export interface WorkOrder extends Document {
  // base field
  woNumber: string;
  woStatus: WoStatusEnum;
  description: string;
  orderId: string;
  workOrderItems: WorkOrderItems[];
  soNumber: string;
  completedDate?: Date;
  ciplNum?: string;
  createdAt?: Date;

  // Base Field All Correct
}

// Nested Array Object
export interface WorkOrderItems {
  _id?: string;
  id?: string;
  set?: any;

  woItemId: string; //in
  runningNum: number; // in
  workType: string; // in
  completedBy: string; // in
  completedDate: Date; // in
  remark: string; // in
  // status?: string; // change from woItemStatus ??
  woItemStatus?: string;

  productId: string;
  skuId: string; // in

  description?: string;
  qty?: number; // in

  // newSku?: string;
  bom?: string;
  picked?: string;
  uom: string;

  doStatus?: string; // from DO
  isCreatedDo?: boolean; // No Longer in use
  confirmQty?: number;
  latestQtyInput?: number;

  // For reporting
  woPickingList?: any;
}

// Enum
export enum WoStatusEnum {
  Open = 'open',
  Waiting = 'waiting',
  Processing = 'processing',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export enum OnActionEnum {
  ONCREATE = 'OnCreate',
  ONUPDATE = 'OnUpdate',
}

// WorkOrder object
export interface WorkOrderObject {
  orderId: string;
  workOrderItems: WorkOrderItems[];
  woNumber: string;
  soNumber: string;
}

// WorkOrder object
export interface QueryPayload {
  runningNum?: any;
  workOrderId: string;
  bomArrayId?: string;
  skuId?: string;
}
