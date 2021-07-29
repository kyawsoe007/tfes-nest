import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const SkuSchema = new Schema({
  unitCost: { type: Number, default: 0 },
  quantity: { type: Number, default: 0 },
  location: { type: Schema.Types.ObjectId, ref: 'StockLocation' },
  remarks: { type: String },
  product: { type: Schema.Types.ObjectId, ref: 'Product' },
  supplierNo: { type: String },
  rsvd: [
    {
      woId: { type: String },
      woItemId: { type: String },
      qty: { type: Number },
    },
  ],
});

SkuSchema.set('toJSON', { virtuals: true });
