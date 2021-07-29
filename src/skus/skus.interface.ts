import { Document } from 'mongoose';

export interface Sku extends Document {
  readonly unitCost: number;
  quantity: number;
  readonly location: any;
  readonly remarks: string;
  readonly product: any;
  readonly supplierNo: string;
  skuPopulated?: any;
  rsvd?: Rsvd[];
}

export interface Rsvd {
  woId: string;
  woItemId: string;
  qty: number;
  totalReserved?: number; // populate purpose only
  set?: any; // virtual
  skuId?: string; // virtual
  woNumber?: string; // virtual
}
