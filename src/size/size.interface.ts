import { Document } from 'mongoose';
export interface Size extends Document {
  readonly name: string;
}
