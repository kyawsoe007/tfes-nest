// export class Cat {}
import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const CreditTermSchema = new Schema({
  name: { type: String },
  term: { type: Number },
});
CreditTermSchema.set('toJSON', { virtuals: true });
