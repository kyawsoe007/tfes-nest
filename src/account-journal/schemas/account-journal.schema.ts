import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;
export const AccountJournalSchema = new Schema(
    {
        name: { type: String },
        debit_account:{type:mongoose.Schema.Types.ObjectId,ref:'AccountItem',required:false},
        credit_account:{type:mongoose.Schema.Types.ObjectId,ref:'AccountItem',required:false},
        currency:{type:mongoose.Schema.Types.ObjectId,ref:'Currency',required:false}
    },

    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    }
);
