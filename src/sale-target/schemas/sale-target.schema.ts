import * as mongoose from 'mongoose';
const Schema=mongoose.Schema;

export const SaleTarget=new Schema(
    {
        name:{type:String},
        target:{type:Number}
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    },
);
SaleTarget.set('toJSON',{virtuals:true})