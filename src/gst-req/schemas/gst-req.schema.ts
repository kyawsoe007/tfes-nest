// export class Cat {}
import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const GstreqSchema = new Schema({
  name: String,
});
GstreqSchema.set('toJSON', { virtuals: true });
