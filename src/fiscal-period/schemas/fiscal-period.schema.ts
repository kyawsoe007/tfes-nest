import * as mongoose from 'mongoose';
const Schema=mongoose.Schema;

export const FiscalPeriodSchema=new Schema({
    startOfDate:{type:Date},
    endOfDate:{type:Date},
    monthly_code:{type:String},
      periodName:{type:String},
      monthly_status:{type:String,enum:['Open','Close'],default:'Open'},
    fiscalYear:{type:mongoose.Schema.Types.ObjectId,ref:'FiscalYear'},
  //      monthlyPeriod:[
  //     {
  //     startOfDate:{type:Date},
  //     endOfDate:{type:Date},
  //     monthly_code:{type:String},
  //     periodName:{type:String},
  //     monthly_status:{type:String,enum:['Open','Close'],default:'Open'}
  //   },
  // ]
},

{
    timestamps: { createdAt: 'createdAt' },
    toJSON: { virtuals: true },
  },
);
FiscalPeriodSchema.set('toJSON',{virtuals:true})