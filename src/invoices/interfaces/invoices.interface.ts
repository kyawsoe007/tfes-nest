import { Document } from 'mongoose';

// Must declare, otherwise wont save into dbase
export interface Invoice extends Document {
  readonly status?: string;
  account?: string;
  journal?: string;
  journalEntryId?:string;
  date?: string;
  custNo: string;
  custId: string;
  custName: string;
  invoiceDate:Date;
  invoiceNumber: string;
  soNumber?: string;
  salesId?: string;
  address: string;
  telNo: string;
  faxNo: string;
  buyerName: string;
  buyerEmail: string;
  delAddress: string;
  paymentAddress: string;
  paymentTerm: string; // Dropdown
  currency?: string; // Dropdown
  currencyRate?: number;
  discount: string;
  discountAmount:number;
  total: number;
  grandTotal:number;
  gst: number;
  downPayment: number;
  remarks: string;
  exportLocal: string;
  salesOrderItems: any; // Object
  toggleGenerateWO?: boolean;
  toggleGeneratePO?: boolean;

  // invoices
  proInvNum?: string;
  taxInvNum?: string;
}
