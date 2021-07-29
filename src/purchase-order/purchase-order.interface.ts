import { Document } from 'mongoose';

// Must declare, otherwise wont save into dbase
export interface Purchase extends Document {
  readonly isConverted?: boolean;
  readonly status?: string;
  createdDate?: Date;
  poNumber?: string;
  purRef?: string;
  purchasePic: string;
  suppNo: string;
  suppRef: string;
  name: string;
  address: string;
  telNo: string;
  faxNo: string;
  buyerName: string;
  buyerEmail: string;
  delAddress: string;
  delDate: string;
  incoterm?: string; // Dropdown
  paymentTerm?: string; // Dropdown
  currency: string; // Dropdown
  discount: number;
  discountAmount: number;
  subTotal: number;
  total: number;
  gst: number;
  gstAmount: number;
  exportLocal: string;
  remarks: string;
  readonly latestPurchase?: boolean; // Mean it works behind the scene
  purchaseOrderItems: any; // Object
  isApprove?: boolean;
  approvedBy?: string;
  currencyRate?: number;
  quoRef?: string;
  purchaseType: string;
  _id?: string;
  newRemarks: string;
  updatedAt: Date;
  salesOrderId?: string;
  invStatus: string;
  discountName: string;
  isPercentage: boolean;
}
