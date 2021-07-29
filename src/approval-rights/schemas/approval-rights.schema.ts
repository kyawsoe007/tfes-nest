import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const ApprovalRightSchema = new Schema(
  {
    type: {
      type: String,
    },
    minAmt: {
      type: Number,
    },
    maxAmt: {
      type: Number,
    },
    roles: [String],
  },
  {
    toJSON: { virtuals: true },
  },
);
