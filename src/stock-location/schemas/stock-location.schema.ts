import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const StockLocationSchema = new Schema({
  // Stock Location Name
  name: { type: String },

  // Stock Location Address
  address: { type: String },
});

StockLocationSchema.set('toJSON', { virtuals: true });
