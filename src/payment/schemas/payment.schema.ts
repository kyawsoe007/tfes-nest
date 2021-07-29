import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const PaymentSchema = new Schema(
  {
      paymentNo: { type: String },
      custId: { type: mongoose.Schema.Types.ObjectId },
      custName: { type: String },
      custNo: { type: String },
      modelId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Invoice",
          required: false
      },
      draftInvoices: [
          {
              allocation: { type: Number },
              modelName: { type: String, default: 'invoice' },
              modelId: { type: mongoose.Schema.Types.ObjectId },
              invoiceNumber: { type: String },
              custId: { type: mongoose.Schema.Types.ObjectId },
              credit: { type: Number },
              debit: { type: Number },
              reconciled: { type: Boolean, default: false },
              reconcileId: { type: mongoose.Schema.Types.ObjectId },
          }
      ],
      draftCreditNotes: [
          {
              allocation: { type: Number },
              modelName: { type: String, default: 'credit-note' },
              modelId: { type: mongoose.Schema.Types.ObjectId },
              invoiceNumber: { type: String },
              custId: { type: mongoose.Schema.Types.ObjectId },
              credit: { type: Number },
              debit: { type: Number },
              reconciled: { type: Boolean, default: false },
              reconcileId: { type: mongoose.Schema.Types.ObjectId },
          }
      ],
      paymentRef: { type: String },
      paymentMethod: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentMethod' },
      currencyRate: { type: Number},
      period: { type: String },
      memo: { type: String },
      status: { type: String },
      total: { type: Number },
      expenseAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'AccountItem'},
      expenseAmount: { type: Number },      
      currencyAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'AccountItem'},
      currencyLossAmount: { type: Number},
      paymentDate:{type:Date}
  },
  {
      timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  },
);

PaymentSchema.set('toJSON', { virtuals: true });
