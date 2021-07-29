import { Document } from 'mongoose';

// Must declare, otherwise wont save into dbase
export interface DebitNote extends Document {
  readonly status?: string;
  account?: string;
  journal?: string;
  invoiceDate?: Date;
  suppNo: string;
  suppId: string;
  suppName: string;
  debitNoteNumber: string;
  soNumber: string;
  address: string;
  telNo: string;
  faxNo: string;
  buyerName: string;
  buyerEmail: string;
  exportLocal: string;
  delAddress: string;
  paymentAddress: string;
  suppInvoiceNo: string;
  paymentTerm: string; // Dropdown
  currency: string; // Dropdown
  discount: number;
  total: number;
  gst: number;
  gstAmount: number;
  downPayment: number;
  remarks: string;
  salesOrderItems: any; // Object
  toggleGenerateWO?: boolean;
  toggleGeneratePO?: boolean;
}
