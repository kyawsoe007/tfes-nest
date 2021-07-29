// export class Cat {}
import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const SelOneSchema = new Schema({
  name: String,
});
SelOneSchema.set('toJSON', { virtuals: true });
