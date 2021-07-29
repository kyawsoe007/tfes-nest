import { Document } from 'mongoose';
export interface Partner extends Document {
  readonly name: string;
  readonly type: string;
  readonly modelId: string;
  readonly modelRef: string;
}
