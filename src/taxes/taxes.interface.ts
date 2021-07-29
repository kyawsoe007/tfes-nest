import { Document } from 'mongoose';

export interface Tax extends Document {
  readonly name: string;
  readonly rate: number;
  readonly account: any;
}
