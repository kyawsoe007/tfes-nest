import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as moment from 'moment';
import { Model } from 'mongoose';
import { CreateFiscalYearDto } from 'src/fiscal-year/dto/create-fiscal-year.dto';
import { UpdateFiscalYearDto } from 'src/fiscal-year/dto/update-fiscal-year.dto';
import { FiscalYearService } from 'src/fiscal-year/fiscal-year.service';
import { CreateFiscalPeriodDto } from './dto/create-fiscal-period.dto';
import { UpdateFiscalPeriodDto } from './dto/update-fiscal-period.dto';
import { FiscalPeriod } from './fiscal-period.interface';

@Injectable()
export class FiscalPeriodService {
  constructor(
    @InjectModel('FiscalPeriod')
    private readonly fiscalPeriodModel:Model<FiscalPeriod>,
    private readonly fiscalYearService:FiscalYearService
  ){}

  async create(createFiscalPeriodDto: CreateFiscalPeriodDto): Promise<FiscalPeriod> {
    const newData=new this.fiscalPeriodModel(createFiscalPeriodDto)
    return await newData.save();
  }

  async createFiscalPeriod(query:any):Promise<any>{
    const startDate=query.startDate?query.startDate:new Date();
    const endDate=query.endDate?query.endDate:new Date(query.endDate);
    const code=query.code?query.code:'';
    const periodName=query.fiscalYear?query.fiscalYear:'';
    let status=query.status?query.status:'';
    let monthlyData=query.monthlyPeriod?query.monthlyPeriod:[];
    if(startDate==endDate){
      let monthly={
        startOfPeriod:startDate,
        endOfPeriod:endDate,
        code:code,
        periodName:periodName
      }
      let data:CreateFiscalYearDto={
        startDate:startDate,
        endDate:endDate,
        code:code,
        fiscalYear:periodName,
        status:status,
      }
          let fiscalYear=await this.fiscalYearService.create(data);
      let fiscalMonthlyData=await this.fiscalYearService.findByMonthly(monthly)
      fiscalMonthlyData.map(async (item)=>{
        let fiscalPeriod={
          startOfDate:item.startOfDate,
        endOfDate:item.endOfDate,
        monthly_code:item.monthly_code,
        periodName:item.periodName,
        monthly_status:item.monthly_status,
          fiscalYear:fiscalYear._id,
        }
        await this.create(fiscalPeriod)
      })
      return fiscalYear
    }
    else{
let data:CreateFiscalYearDto={
  startDate:startDate,
  endDate:endDate,
  code:code,
  fiscalYear:periodName,
  status:status,
}
    let fiscalYear=await this.fiscalYearService.create(data);
  monthlyData.map(async (item)=>{
    let fiscalPeriod={
      startOfDate:item.startOfDate,
        endOfDate:item.endOfDate,
        monthly_code:item.monthly_code,
        periodName:item.periodName,
        monthly_status:item.monthly_status,
      fiscalYear:fiscalYear._id
    }
    await this.create(fiscalPeriod)
  })
    return fiscalYear
  }}

  async updateFiscalPeriod(query:any):Promise<any>{
    const startDate=query.startDate?query.startDate:new Date();
    const endDate=query.endDate?query.endDate:new Date(query.endDate);
    const code=query.code?query.code:'';
    const periodName=query.fiscalYear?query.fiscalYear:'';
    let status=query.status?query.status:'';
    let monthlyData=query.monthlyPeriod?query.monthlyPeriod:[];
    console.log('query',query)
    let id=query._id?query._id:query.id;
    let data:UpdateFiscalYearDto={
      startDate:startDate,
      endDate:endDate,
      code:code,
      fiscalYear:periodName,
      status:status,
    }
   await this.fiscalYearService.update(id,data)

   monthlyData.map(async (item)=>{
    let fiscalPeriod={
      startOfDate:item.startOfDate,
        endOfDate:item.endOfDate,
        monthly_code:item.monthly_code,
        periodName:item.periodName,
        monthly_status:item.monthly_status,
      fiscalYear:id
    }
    console.log('ids',item)
    await this.update(item.id,fiscalPeriod)
  })
  
  }

  async findWithYearId(id:string):Promise<FiscalPeriod[]>{
    return await this.fiscalPeriodModel.find({fiscalYear:id})
  }

  async findAll():Promise<FiscalPeriod[]> {
    const res= await this.fiscalPeriodModel.find();
  //  await Promise.all(
  //    res.map(async (type) => {
  //      if(type.fiscalYear && type.fiscalYear!=''){
        //  const fiscalYear=await this.fiscalYearService.findOne(
        //    type.fiscalYear
        //  );
  //        type.set('startDate',fiscalYear.startDate,{strict:false});
  //        type.set('endDate',fiscalYear.endDate,{strict:false});
  //        type.set('code',fiscalYear.code,{strict:false});
  //        type.set('fiscalYears',fiscalYear.fiscalYear,{strict:false});
  //        type.set('status',fiscalYear.status,{strict:false});
  //      }
  //    }
  //    )
  //  )
    return res
  }
  async findWithCurrentDate():Promise<FiscalPeriod[]>{
    const firstdate = moment().startOf('month').format('YYYY-MM');
console.log(firstdate);

console.log("current month last date");
    const endOfDate=moment(new Date(moment().year(), moment().month()+1, 0)).format('YYYY-MM-DD');
console.log(endOfDate); 
    return await this.fiscalPeriodModel
    .find({ startOfDate: { $gte: new Date(firstdate), $lte: new Date(endOfDate) } })
    .exec();
  }

  async findOne(id: string): Promise<FiscalPeriod> {
    return await this.fiscalPeriodModel.findOne({_id:id});
  }

  async findOneWithInvoiceDate(query:any){
    const Startdate=moment(query).startOf('month').format('YYYY-MM-DD')
    const endOfDate=moment(new Date(moment().year(), moment().month()+1, 0)).format('YYYY-MM-DD');
    return await this.fiscalPeriodModel.findOne({startOfDate:{$gte:new Date(Startdate),$lte:new Date(endOfDate)}})

  }

  async update(id: string, updateFiscalPeriodDto: UpdateFiscalPeriodDto
    ):Promise<FiscalPeriod> {
    let res=await this.fiscalPeriodModel.findByIdAndUpdate(
  {_id:id},
  UpdateFiscalPeriodDto,
  {new:true}
  );
  
  return res;
  }

async removeId(id:string):Promise<any>{
 let fiscalYear= await this.fiscalYearService.remove(id)
  const fiscalPeriod=await this.findWithYearId(id)
  fiscalPeriod.map(async (item)=>{
    return await this.remove(item.id)
  })
return fiscalYear
}

  async remove(id: string) :Promise<any>{
    return await this.fiscalPeriodModel.findByIdAndRemove({_id:id});
  }
}
