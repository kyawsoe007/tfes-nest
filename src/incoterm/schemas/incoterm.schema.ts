// export class Cat {}
import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const IncotermSchema = new Schema({
  name: String,
});
IncotermSchema.set('toJSON', { virtuals: true });
