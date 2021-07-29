import { Document } from 'mongoose';

export interface AccountJournal extends Document {
  name: string;
  debit_account: string;
  credit_account: string;
  currency: string;
  _id?: string;
}
