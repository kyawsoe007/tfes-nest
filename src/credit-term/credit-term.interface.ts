import { Document } from 'mongoose';
export interface CreditTerm extends Document {
  readonly name: string;
  readonly term: number;
}
