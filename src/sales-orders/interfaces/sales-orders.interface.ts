import { Document } from 'mongoose';

// Must declare, otherwise wont save into dbase
export interface SalesOrder extends Document {
  status?: string;
  createdDate: Date;
  readonly latestSalesOrder?: boolean;
  exportLocal: string;
  versionNum: number;
  custNo: string;
  custId: string;
  custName: string;
  custPoNum?: string;
  soNumber: string;
  address: string;
  telNo: string;
  faxNo: string;
  buyerName: string;
  buyerEmail: string;
  poNumber: string;
  delAddress: string;
  paymentAddress: string;
  incoterm: string;
  paymentTerm: string;
  currency: string;
  discount: number;
  total: number;
  gst: number;
  downPayment: number;
  quoRef: string;
  remarks: string;
  leadTime: string;
  deliveryRemark: string;
  prices: string;
  validity: string;
  discountAmt: number;
  subTotalAmt: number;
  gstAmt: number;
  currencyRate?: number;
  initialVersion: string;
  salesOrderItems: any; // Object
  profitDetails: any;

  quotation?: string; // Quotation Id
  oldVersionList?: any;
  toggleGenerateWO?: boolean;
  salesPic: string;
  purchaseId?: string;
  doCount?: number;
  doStatus?: string;
  ciplNum?: string;
  discountName?: string;
  woStatus?: string;
  internalRemarks: string;
  freightAmount: number;
  file: string;
  updatedAt: Date;
  plNum?: string;
  isPercentage: boolean;
}

export interface SalesOrderItems {
  _id: string;
  SN: number;
  sku: string;
  productId: string;
  custRef: string;
  description: string;
  qty: number;
  unitPrice: number;
  extPrice: number;
  bom: string;
  uom: string;
  BomList?: any;

  // populate purposes
  set?: any;
  uomName?: string;
  equals?: any;
}

export interface QuotationConvert {
  custNo: string;
  custName: string;
  custId: string;
  address: string;
  telNo: string;
  faxNo: string;
  buyerName: string;
  buyerEmail: string;
  delAddress: string;
  paymentAddress: string;
  incoterm: string;
  paymentTerm: string;
  currency: string;
  discount: number;
  total: number;
  gst: number;
  downPayment: number;
  sku: string;
  quotation?: string;
  salesOrderItems: any;
  exportLocal: string;
  remarks: string;
  ciplNum?: string;
  updatedAt: Date;
}
