import { Document } from 'mongoose';
export interface Uom extends Document {
  readonly name: string;
}
