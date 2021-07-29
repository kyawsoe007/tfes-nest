import { Document } from 'mongoose';

export interface SequenceSetting extends Document {
  readonly prefix: string;
  readonly suffix: string;
  readonly numDigits: number;
  readonly nextNumber: number;
  readonly modelName: string;
  readonly year: boolean;
}
