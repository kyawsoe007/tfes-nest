import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const PurchaseListTempSchema = new Schema(
  {
    salesOrderId: { type: mongoose.Schema.Types.ObjectId },
    description: { type: String },
    productId: { type: mongoose.Schema.Types.ObjectId },
    sku: { type: mongoose.Schema.Types.ObjectId },
    qty: { type: Number, default: 0 },
    isChecked: { type: Boolean, default: false },
    isLatest: { type: Boolean },
    isPoSubmitted: { type: Boolean },
    suppName: { type: String },
  },
  {
    toJSON: { virtuals: true },
  },
);
