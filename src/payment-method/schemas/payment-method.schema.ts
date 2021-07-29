import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;
export const PaymentMethodSchema = new Schema(
    {
        name: { type: String },
        account: { type: mongoose.Schema.Types.ObjectId, ref: 'AccountItem'},
        journal: { type: mongoose.Schema.Types.ObjectId, ref: 'AccountJournal'},
        currency: { type: mongoose.Schema.Types.ObjectId, ref: 'Currency'}
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    }
);
