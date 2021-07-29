import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const CurrencySchema = new Schema(
  {
    name: {
      type: String,
      // required: true,
    },
    symbol: {
      type: String,
    },
    currencySymbol: {
      type: String,
    },
    latestRate: {
      type: Number,
    },
    // rate: {
    //   type: Number,
    //   // required: true,
    // },
    currencyRate: [
      {
        date: { type: Date },
        rate: { type: Number },
        type: { type: String, enum: ['sales', 'purchase'], default: 'sales' },
      },
    ],
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    toJSON: { virtuals: true },
  },
);

CurrencySchema.set('toJSON', { virtuals: true });
