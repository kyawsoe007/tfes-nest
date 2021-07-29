// export class Cat {}
import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const CreditLimitSchema = new Schema({
  name: String,
  amount: Number
});
CreditLimitSchema.set('toJSON', { virtuals: true });
