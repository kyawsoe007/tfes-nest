import { Document } from 'mongoose';

export interface ApprovalRight extends Document {
  readonly type: string;
  readonly minAmt: number;
  readonly maxAmt: number;
  readonly roles: string[];
}
