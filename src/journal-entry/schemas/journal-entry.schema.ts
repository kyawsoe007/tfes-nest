import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;
export const JournalEntrySchema = new Schema(
  {
    journalEntryNum: { type: String },
    period: { type: mongoose.Schema.Types.ObjectId, ref: 'FiscalPeriod' },
    reference: { type: String },
    toReview: { type: Boolean },
    journalValue: { type: Schema.Types.ObjectId, ref: 'AccountJournal' },
    remarks: { type: String },
    status: { type: String, default: 'draft' },
    totalDebit: { type: Number, default: 0 },
    totalCredit: { type: Number, default: 0 },
    entryDate: { type: Date },
    journalItems: [
      {
        account: { type: mongoose.Schema.Types.ObjectId, ref: 'AccountItem' },
        amountCurrency: { type: Number },
        credit: { type: Number },
        debit: { type: Number },
        currency: { type: Schema.Types.ObjectId, ref: 'Currency' },
        dueDate: { type: String },
        name: { type: String },
        partialReconcile: { type: String },
        partner: { type: String },
        partner_id: { type: Schema.Types.ObjectId, ref: 'Partner' },
        reconcile: { type: String },
        reference: { type: String },
        taxAmount: { type: Number },
      },
    ],
    modelId: { type: mongoose.Schema.Types.ObjectId },
    modelName: { type: String },
    isOpening: { type: Boolean, default: false }
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  },
);
