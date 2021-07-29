import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const TaxSchema = new Schema({
  name: {
    type: String,
    // required: true,
  },
  rate: {
    type: Number,
    // required: true,
  },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'AccountItem' }
});

TaxSchema.set('toJSON', { virtuals: true });
