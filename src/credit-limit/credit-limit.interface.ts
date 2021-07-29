import { Document } from 'mongoose';
export interface CreditLimit extends Document {
  readonly name: string;
  readonly amount: number;
}
