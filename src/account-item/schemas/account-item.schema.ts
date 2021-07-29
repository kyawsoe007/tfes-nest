import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;
export const AccountItemSchema = new Schema(
    {
        accountCode: { type: String },
        accountName: { type: String },
        debit: { type: String },
        credit: { type: String },
        balance: { type: Number },
        internalType: {
            type: String,           
            default:'View',
        },
        companyCurrency: { type: mongoose.Schema.Types.ObjectId,ref:'Currency',required:false },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    }
)