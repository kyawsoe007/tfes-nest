import { Document } from 'mongoose';
export interface SelOne extends Document {
  readonly name: string;
}
