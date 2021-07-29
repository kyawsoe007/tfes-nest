// export class Cat {}
import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const BrandSchema = new Schema({
  name: String,
});

BrandSchema.set('toJSON', { virtuals: true });
