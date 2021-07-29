import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const BomSchema = new Schema({
  description: { type: String },
  productList: [
    {
      sku: { type: mongoose.Schema.Types.ObjectId, ref: 'Sku' },
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      qty: { type: Number },
    },
  ],
  // isCreated: { type: Boolean, default: false },
});

BomSchema.set('toJSON', { virtuals: true });
