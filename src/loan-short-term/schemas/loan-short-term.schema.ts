import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const LoanShortTermSchema = new Schema(
  {
    loanName: { type: String },
    bank: { type: String },
    paymentStartDate: { type: Date },
    loanAmount: { type: Number },
    poNumber: { type: String },
    debit_account: { type: Schema.Types.ObjectId, ref:'AccountItem' },
    credit_account: { type: Schema.Types.ObjectId, ref:'AccountItem' },
    interest_account: { type: Schema.Types.ObjectId, ref:'AccountItem' },
    suppId: { type: Schema.Types.ObjectId, ref:'Supplier' },
    active: { type: Boolean },
    currency: { type: Schema.Types.ObjectId, ref: "Currency"},
    loanList: [
      {
        date: { type: Date },
        amount: { type: Number },
        interestAmount: { type: Number },
        miscellaneous_amount:{type:Number},
        account:{type:Schema.Types.ObjectId,ref:'AccountItem'}, 
        journalId: { type: String}
      },
    ],
    
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    toJSON: { virtuals: true },
  },
);
