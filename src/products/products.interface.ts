import { Document } from 'mongoose';
export interface Product extends Document {
  name: string;
  partNumber: string;
  description: string;
  averagePrice: number;
  listPrice: number;
  unitCost: number;
  skus: any;

  readonly Supplier: string;
  readonly brand: string;
  readonly grpOne: string;
  readonly grpTwo: string;
  readonly currency: string;
  readonly selOne: string;
  readonly selTwo: string;
  readonly size: string;
  readonly material: string;
  readonly uom: string;
  readonly supp1: string;
  readonly supp2: string;
  readonly supp3: string;
  readonly supp4: string;
  readonly supp5: string;
  bom: string;
  readonly location: string;
  isFreight?: boolean;
}
