import { Document } from 'mongoose';

export interface Bom extends Document {
  _id: string;
  description: string;
  readonly productList: any;
  // isCreated: boolean;
}
