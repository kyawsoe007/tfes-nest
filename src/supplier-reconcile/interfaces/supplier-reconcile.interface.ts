import { Document } from 'mongoose';

// Must declare, otherwise wont save into dbase
export interface SupplierReconcile extends Document {
  readonly _id?: string;
  readonly modelName: string;
  readonly modelId: string;
   invoiceNumber: string;
   suppId: string;
  readonly credit: number;
   debit: number;
  readonly reconcileId: string;
  readonly reconciled: boolean;
  allocation: number;
  readonly origin: boolean;
}
