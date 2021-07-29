import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const SupplierReconcileSchema = new Schema(
  {
      modelName: { type: String },
      modelId: { type: mongoose.Schema.Types.ObjectId },
      invoiceNumber: { type: String },
      suppId: { type: mongoose.Schema.Types.ObjectId },
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

SupplierReconcileSchema.set('toJSON', { virtuals: true });
