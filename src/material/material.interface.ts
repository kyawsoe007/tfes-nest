import { Document } from 'mongoose';
export interface Material extends Document {
  readonly name: string;
}
