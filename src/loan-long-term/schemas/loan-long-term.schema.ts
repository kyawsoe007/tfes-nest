// export class Cat {}
import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const LoanLongTermSchema = new Schema(
  {
    name: { type: String },
    bank: { type: String },
    loanDepositDate: { type: Date},
    paymentStartDate: { type: Date },
    loanAmount: { type: Number },
    loanDuration: { type: Number },
    monthlyInstall: { type: Number },
    debit_account: { type: Schema.Types.ObjectId ,ref:'AccountItem'},
    credit_account: { type: Schema.Types.ObjectId ,ref:'AccountItem'},
    interest_account: { type: Schema.Types.ObjectId ,ref:'AccountItem'},
    currency:{type:Schema.Types.ObjectId,ref:'Currency'},
    // interestRate: { type: Schema.Types.ObjectId },
    interestRate: { type: Number },

    active: { type: Boolean },
    loanJournalsCreated: [
      {
          journalId: { type: mongoose.Schema.Types.ObjectId, ref: "JournalEntry"},
          date: { type: Date},
          amount: { type: Number }                
      }
    ]
    // loanList: [],
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    toJSON: { virtuals: true },
  },
);
