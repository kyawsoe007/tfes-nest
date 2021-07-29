import { Document } from 'mongoose';

export interface StockLocation extends Document {
  name: string;
  readonly address: string;
}
