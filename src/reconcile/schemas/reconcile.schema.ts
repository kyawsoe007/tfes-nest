import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const ReconcileSchema = new Schema(
  {
      number: { type: String },
      modelName: { type: String },
      modelId: { type: mongoose.Schema.Types.ObjectId },
      invoiceNumber: { type: String },
      custId: { type: mongoose.Schema.Types.ObjectId },
      credit: { type: Number },
      debit: { type: Number },
      reconcileId: { type: String },
      reconciled: { type: Boolean },
      origin: { type: Boolean },
      allocation: { type: Number, default: 0 }
  },
  {
      timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  },
);

ReconcileSchema.set('toJSON', { virtuals: true });
