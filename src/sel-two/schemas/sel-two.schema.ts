// export class Cat {}
import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const SelTwoSchema = new Schema({
  name: String,
});
SelTwoSchema.set('toJSON', { virtuals: true });
