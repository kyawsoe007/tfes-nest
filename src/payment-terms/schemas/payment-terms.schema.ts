import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const PaymentTermSchema = new Schema({
  name: String,
  days: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
PaymentTermSchema.set('toJSON', { virtuals: true });
