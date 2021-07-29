import { Document } from 'mongoose';

export interface Discount extends Document {
  readonly type: string;
  readonly name: string;
  readonly value: number;
  readonly isPercentage: boolean;
}
