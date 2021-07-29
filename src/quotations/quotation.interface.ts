import { Document } from 'mongoose';

export enum ExportLocal {
  LOCAL = 'local',
  EXPORT = 'export',
}

// Must declare, otherwise wont save into dbase
export interface Quotation extends Document {
  readonly isConverted?: boolean;
  readonly status?: string;
  createdDate: Date;
  quoRef?: string;
  soNumber?: string;
  soStatus?: string;
  salesPic?: string;
  initialVersion: string;
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
  incoterm: string; // Dropdown
  paymentTerm?: string; // Dropdown
  currency: string; // Dropdown
  currencyRate?: number;
  discount: number;
  total: number;
  gst: number;
  downPayment: number;
  exportLocal: string;
  versionNum: number;
  remarks: string;
  readonly latestQuotation?: boolean; // Mean it works behind the scene
  salesOrderItems: any; // Object
  oldVersionList?: any;
  leadTime: string;
  deliveryRemark: string;
  custPoNum: string;
  prices: string;
  validity: string;
  salesOrder?: string; // Sales Order Id
  discountAmt: number;
  subTotalAmt: number;
  gstAmt: number;
  box?: string;
  header?: string;
  discountName: string;
  workScope?: string;
  isPercentage: boolean;
  file: string;

  salesPicFirstName?: string;
  salesPicLastName?: string;
}
