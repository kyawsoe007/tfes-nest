import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const ProfitSchema = new Schema(
    {
        accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'AccountItem' },
        internal: { type: String, enum: ['INCOME', 'Other Income', 'COGS', 'Expenses', 'Other Expenses'] }
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    },
);
ProfitSchema.set('toJSON', { virtuals: true })