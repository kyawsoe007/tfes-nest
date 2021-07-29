import { Document } from 'mongoose';
export interface Brand extends Document {
  readonly name: string;
}
