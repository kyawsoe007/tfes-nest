import { Document } from 'mongoose';

// Must declare, otherwise wont save into dbase
export interface SupplierPayment extends Document {
  readonly _id?: string;
  readonly paymentNo: string;
  readonly suppId: string;
  readonly suppName: string;
  readonly suppNo: string;
  draftInvoices: any;
  draftDebitNotes: any;
  readonly modelId: string;
  readonly period: string;
  readonly memo: string;
  readonly paymentRef: string;
  readonly paymentMethod?: string;
  shortTermPaymentId: string;
  readonly status: string;
  readonly total: number;
  currencyRate:number;
  paymentDate:Date;
}
