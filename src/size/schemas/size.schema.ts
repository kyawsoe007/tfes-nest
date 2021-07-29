// export class Cat {}
import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const SizeSchema = new Schema({
  name: String,
});
SizeSchema.set('toJSON', { virtuals: true });
