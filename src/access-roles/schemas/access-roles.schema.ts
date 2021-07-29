import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const AccessRoleSchema = new Schema(
  {
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AccessRight',
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    toJSON: { virtuals: true },
  },
);
