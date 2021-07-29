import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const BillingCurrencySchema = new Schema({
  name: {
    type: String,
    // required: true,
  },
  rate: {
    type: Number,
    // required: true,
  },
});

BillingCurrencySchema.set('toJSON', { virtuals: true });
