import { Document } from 'mongoose';

// Must declare, otherwise wont save into dbase
export interface Payment extends Document {
  readonly _id?: string;
  readonly paymentNo: string;
  readonly custId: string;
  readonly custName: string;
  readonly custNo: string;
  draftInvoices: any;
  draftCreditNotes: any;
  readonly modelId: string;
  readonly period: string;
  readonly memo: string;
  readonly paymentRef: string;
  readonly paymentMethod: string;
  readonly status: string;
  readonly total: number;
  currencyRate: number;
  paymentDate:Date;
}
