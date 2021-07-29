import { Document } from 'mongoose';

export enum PackinglistStatus {
  OPEN = 'open',
  DRAFT = 'draft',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
}
export enum PackItemStatus {
  OPEN = 'open',
  COMPLETED = 'completed',
}

// Must declare, otherwise wont save into dbase
export interface PackingList extends Document {
  packingNum?: string;
  operationId?: string;
  orderId: string;
  pickedBy?: string;
  packinglistStatus?: PackinglistStatus;
  packItems: PackItems[];
  deliveryId: string;
  workOrderId: string;
  hsCode: string;
  cooCode: string;
  completedDate?: Date;
  packagingType: PackagingType[];
  remark: string;
  soDelRemark: string;
  createdAt: Date;
  soNumber: string;
}

export interface PackagingType {
  container: string;
  measurement: string;
  weight: string;
  cooCode: string;
  hsCode: string;
}

export interface PackItems {
  set?: any;
  workItemId?: string;
  runningNum?: number;
  packItemStatus?: PackItemStatus;
  container?: string;
  productId: string;
  qty?: number;
  sku?: string;
  _id?: string;
  measurement?: string;
  weight?: string;
  hsCode?: string;
  cooCode?: string;
  uom?: string;
  custRef?: string;

  // for Commercial Invoice report
  unitPrice?: number;
  extPrice?: number;
  currency?: string;
  gst?: string;

  // For generating report
  description?: string;
}
export interface PackingListObject {
  orderId: string;
  packListing: any;
  packingNum: string;
}
