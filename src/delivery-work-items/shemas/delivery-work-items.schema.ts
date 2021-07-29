import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const DeliveryWoItemSchema = new Schema(
  // Base Field
  {
    deliveryId: { type: mongoose.Schema.Types.ObjectId },
    workOrderId: { type: mongoose.Schema.Types.ObjectId },
    woItemId: { type: mongoose.Schema.Types.ObjectId },
    qty: { type: Number },
    initialQty: { type: Number },
    isClosed: { type: Boolean, default: false },
    partialCount: { type: Number },
  },
  {
    toJSON: { virtuals: true },
  },
);
