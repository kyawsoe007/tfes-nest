// export class Cat {}
import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const GrpOneSchema = new Schema({
  name: String,
});
GrpOneSchema.set('toJSON', { virtuals: true });
