import * as mongoose from 'mongoose';
const Schema=mongoose.Schema;

export const FiscalYearSchema=new Schema({
    code:{type:String},
    fiscalYear:{type:String},
    status:{type:String,enum:['Open','Close'],default:'Open'},
    startDate:{type:Date},
    endDate:{type:Date},
    // monthlyPeriod:{type:mongoose.Schema.Types.ObjectId,ref:'FiscalPeriod'}
  //   monthlyPeriod:[
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
FiscalYearSchema.set('toJSON',{virtuals:true})