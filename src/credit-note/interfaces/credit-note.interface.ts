import { Document } from 'mongoose';

// Must declare, otherwise wont save into dbase
export interface CreditNote extends Document {
  readonly status?: string;
  account?: string;
  journal?: string;
  date?: Date;
  custNo: string;
  custId: string;
  custName: string;
  creditNoteNumber: string;
  soNumber: string;
  address: string;
  telNo: string;
  faxNo: string;
  buyerName: string;
  buyerEmail: string;
  exportLocal: string;
  delAddress: string;
  paymentAddress: string;
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
