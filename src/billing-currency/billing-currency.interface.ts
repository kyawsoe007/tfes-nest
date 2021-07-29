import { Document } from 'mongoose';

export interface BillingCurrency extends Document {
  readonly name: string;
  readonly rate: number;
}
