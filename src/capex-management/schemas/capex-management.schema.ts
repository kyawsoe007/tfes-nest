import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;
export const CapexManagementSchema = new Schema(
    {
        name: { type: String },
        purchase_value: { type: Number },
        outstanding_loan: { type: Number },
        monthly_installment: { type: Number },
        loan_installment:{type:Number},
        months_left: { type: String },
        remarks: { type: String },
        life_span: { type: Number },
        residual_amount:{type:Number},
        purchase_date: { type: Date },
        depreciation_type: {
            type: String,
            enum: ['Monthly', 'Yearly'],
            default:'Monthly'
        },
        bank: { type: String },
        loan_duration: { type: Number },
        payment_startdate: { type: Date },
        loanDepositDate: { type: Date},
        interest_rate: { type: Number },
        loan_amount:{type:Number},
        active:{type:Boolean},
        debit_account:{type:mongoose.Schema.Types.ObjectId,ref:'AccountItem',required:false},
        credit_account:{type:mongoose.Schema.Types.ObjectId,ref:'AccountItem',required:false},
        loan_debit_account:{type:mongoose.Schema.Types.ObjectId,ref:'AccountItem',required:false},
        loan_credit_account:{type:mongoose.Schema.Types.ObjectId,ref:'AccountItem',required:false},
        loan_interest_account: {type:mongoose.Schema.Types.ObjectId,ref:'AccountItem',required:false},
        journalsCreated: [
            {
                journalId: { type: mongoose.Schema.Types.ObjectId, ref: "JournalEntry"},
                date: { type: Date},
                amount: { type: Number }                
            }
        ],
        loanJournalsCreated: [
            {
                journalId: { type: mongoose.Schema.Types.ObjectId, ref: "JournalEntry"},
                date: { type: Date},
                amount: { type: Number }                
            }
        ]
    },
    {
        timestamps: { createdAt: 'createdAt' },
        toJSON: { virtuals: true },
      },
)