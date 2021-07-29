// export class Cat {}
import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const DownPaymentSchema = new Schema({
  name: String,
  amount:Number
});
DownPaymentSchema.set('toJSON', { virtuals: true });
