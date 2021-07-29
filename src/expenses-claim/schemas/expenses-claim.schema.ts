import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const ExpensesClaimSchema = new Schema(
  {
    status: { type: String, default: 'draft' },
    createdDate: { type: Date },
    claimNo: { type: String },
    userClaim: { type: Schema.Types.ObjectId },
    getApproval: { type: Boolean, default: false },
    approvedBy: { type: Schema.Types.ObjectId },
    remark: { type: String },
    claimItems: [
      {
        lineNum: { type: Number },
        date: { type: Date },
        description: { type: String },
        claimType: { type: String },
        amount: { type: Number },
        gstAmt: { type: Number },
        currency: { type: Schema.Types.ObjectId },
        adminRemark: { type: String },
        currencyRate: { type: Number },
      },
    ],
    file: { type: mongoose.Schema.Types.ObjectId, ref: 'Upload' },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    toJSON: { virtuals: true },
  },
);
