import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const DiscountSchema = new Schema({
  type: { type: String },
  name: {
    type: String,
  },
  value: {
    type: Number,
  },
  isPercentage: { type: Boolean, default: true },
});

DiscountSchema.set('toJSON', { virtuals: true });
