import { Document } from 'mongoose';

export interface PaymentTerm extends Document {
  readonly name: string;
  readonly days: number;
}
