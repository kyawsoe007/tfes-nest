import { Document } from 'mongoose';
export interface GstReq extends Document {
  readonly name: string;
}
