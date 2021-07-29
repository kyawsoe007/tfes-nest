import * as mongoose from 'mongoose';
const Schema=mongoose.Schema;

export const PurchaseSettingSchema = new Schema(
    {
        setting_name:{type:String},

        account:{type:mongoose.Schema.Types.ObjectId,ref:'AccountItem'}
    },
    {
        timestamps:{ createdAt:'createdAt' , updatedAt:'updatedAt'},
    },
);

PurchaseSettingSchema.set('toJSON',{virtuals:true});