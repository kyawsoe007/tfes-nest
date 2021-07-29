import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;
export const LoanManagementSchema = new Schema(
    {
        bank: { type: String},
        loan_duration: { type: Number },
        payment_startdate: { type: Date },
        transferDate: { type: Date },
        interest_rate: { type: Number },
        loan_amount:{type:Number},
        active:{type:Boolean},
        debit_account:{type:mongoose.Schema.Types.ObjectId,ref:'AccountItem',required:false},
        credit_account:{type:mongoose.Schema.Types.ObjectId,ref:'AccountItem',required:false},
        loan_installment: { type: Number},
        outstanding_loan: { type: Number}
    }
)