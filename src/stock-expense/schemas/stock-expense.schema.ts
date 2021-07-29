import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const StockExpenseSchema=new Schema(
    {
     tfesPic:{type:mongoose.Schema.Types.ObjectId,ref:'User'},
     status:{type:String,enum:['draft','closed'],default:'draft'},
     date:{type:Date},
     remarks:{type:String}, 
     stockExpenseItem:[
        {
            SN: { type: Number },
            description: { type: String },
            qty: { type: Number },
            reason:{type:String},
            skuId:{type:mongoose.Schema.Types.ObjectId,ref:'Sku'},
            productId:{ type:mongoose.Schema.Types.ObjectId,ref:'Product'}
            //account: { type: mongoose.Schema.Types.ObjectId },
          },
     ],   
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    }
);
StockExpenseSchema.set('toJSON', {virtuals:true})