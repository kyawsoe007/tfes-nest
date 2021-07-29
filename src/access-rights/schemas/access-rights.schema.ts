import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const AccessRightSchema = new Schema(
  {
    name: { type: String },
    access: [{ type: String }],
    isManager: { type: Boolean, default: false },
  },
  {
    toJSON: { virtuals: true },
  },
);
