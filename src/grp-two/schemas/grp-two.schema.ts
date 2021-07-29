// export class Cat {}
import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const GrpTwoSchema = new Schema({
  name: String,
});
GrpTwoSchema.set('toJSON', { virtuals: true });
