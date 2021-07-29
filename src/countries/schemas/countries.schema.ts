import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const CountrySchema = new Schema({
  name: {
    type: String,
    // required: true,
  },
});

CountrySchema.set('toJSON', { virtuals: true });
