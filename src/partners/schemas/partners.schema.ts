import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const PartnerSchema = new Schema(
  {
    name: { type: String },
    model: { type: String },
    modelId: { type: mongoose.Schema.Types.ObjectId, refPath: 'modelRefs' },
    modelRefs: { type: String, enum: ['Customer', 'Supplier', 'Employee'] },
  },
  {
    timestamps: { createdAt: 'createdAt' },
    toJSON: { virtuals: true },
  },
);
