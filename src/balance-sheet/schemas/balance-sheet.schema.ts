
import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const BalanceSheetSchema = new Schema({
    internalType: { type: String },
    levelOne: { type: String },
    levelTwo: [{
        accountId: { type: mongoose.Types.ObjectId, ref: 'AccountItem' }
    }
    ]
},
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    }
);
BalanceSheetSchema.set('toJSON', { virtuals: true });
