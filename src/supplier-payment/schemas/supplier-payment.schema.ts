import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const SupplierPaymentSchema = new Schema(
  {
      paymentNo: { type: String },
      suppId: { type: mongoose.Schema.Types.ObjectId },
      suppName: { type: String },
      suppNo: { type: String },
      modelId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SupplierInvoice",
          required: false
      },
      draftInvoices: [
          {
              allocation: { type: Number },
              modelName: { type: String, default: 'supplierinvoice' },
              modelId: { type: mongoose.Schema.Types.ObjectId },
              invoiceNumber: { type: String },
              custId: { type: mongoose.Schema.Types.ObjectId },
              credit: { type: Number },
              debit: { type: Number },
              reconciled: { type: Boolean, default: false },
              reconcileId: { type: mongoose.Schema.Types.ObjectId },
          }
      ],
      draftDebitNotes: [
        {
            allocation: { type: Number },
            modelName: { type: String, default: 'debit-note' },
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
      shortTermPaymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'LoanShortTerm' },
      period: { type: String },
      memo: { type: String },
      status: { type: String },
      total: { type: Number },
      currencyRate: { type: Number},
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

SupplierPaymentSchema.set('toJSON', { virtuals: true });
