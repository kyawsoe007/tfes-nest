import { Document } from 'mongoose';

// Must declare, otherwise wont save into dbase
export interface SupplierInvoice extends Document {
  readonly status?: string;
  suppNo: string;
  suppId: string;
  suppName: string;
  invoiceNumber: string;
  invoiceDate: Date;
  account?: string;
  journal?: string;
  soNumber: string;
  address: string;
  telNo: string;
  faxNo: string;
  buyerName: string;
  buyerEmail: string;
  delAddress: string;
  paymentAddress: string;
  paymentTerm: string; // Dropdown
  currency: string; // Dropdown
  discount: string;
  discountAmount: number;
  total: number;
  gst: number;
  downPayment: number;
  remarks: string;
  exportLocal: string;
  salesOrderItems: any; // Object
  toggleGenerateWO?: boolean;
  toggleGeneratePO?: boolean;
  suppInvoiceNo?: string;
  gstAmount: number;
}
