import { Document } from 'mongoose';

// Must declare, otherwise wont save into dbase
export interface Reconcile extends Document {
  readonly number:string,
  readonly _id?: string;
  readonly modelName: string;
  readonly modelId: string;
   invoiceNumber: string;
   custId: string;
  credit: number;
   debit: number;
  readonly reconcileId: string;
  readonly reconciled: boolean;
  allocation: number;
  readonly origin: boolean;
}
