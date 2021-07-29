import { Document } from 'mongoose';
export interface DownPayment extends Document {
  readonly name: string;
  readonly amount: number;
}
