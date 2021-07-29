// export class Cat {}
import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const UomSchema = new Schema({
  name: String,
});
UomSchema.set('toJSON', { virtuals: true });
