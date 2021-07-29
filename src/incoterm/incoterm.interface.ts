import { Document } from 'mongoose';
export interface Incoterm extends Document {
  readonly name: string;
}
