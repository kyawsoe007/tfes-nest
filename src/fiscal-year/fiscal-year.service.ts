import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateFiscalYearDto } from './dto/create-fiscal-year.dto';
import { UpdateFiscalYearDto } from './dto/update-fiscal-year.dto';
import { FiscalYear } from './fiscal-year.interface';
import * as moment from 'moment';
@Injectable()
export class FiscalYearService {
  constructor(
    @InjectModel('FiscalYear')
    private readonly fiscalYearModel:Model<FiscalYear>,
  ){}
  async create(
    createFiscalYearDto: CreateFiscalYearDto
  ): Promise<FiscalYear> {
    const newCat = new this.fiscalYearModel(createFiscalYearDto);
    return await newCat.save();
  }
  
  async findAll(): Promise<FiscalYear[]> {
    const response = await this.fiscalYearModel.find();
    return response;
  }

async findByMonthly(query:any):Promise<any>{
const startOfPeriod=query.startOfPeriod?query.startOfPeriod:new Date();
const endOfPeriod=query.endPeriod?query.endPeriod:new Date(query.endOfPeriod);
const code=query.code?query.code:'';
const periodName=query.periodName?query.periodName:'';
const checkMonth=query.checkMonth?query.checkMonth:1;
let fiscalYearByMonthly=[]
console.log('hiis',endOfPeriod)
console.log('end',query.endOfPeriod)
 endOfPeriod.setMonth(endOfPeriod.getMonth()-1);
  var month = moment(startOfPeriod); 
  let generateCode=0;
  for (month; month <= endOfPeriod;month.add(checkMonth, "month")) {
      generateCode++
     let data = {
     startOfDate: moment(new Date(month.year(),month.month(),1)).format('YYYY-MM-DD'),
     endOfDate:moment(new Date(month.year(), month.month()+1, 0)).format('YYYY-MM-DD'),
     monthly_code:generateCode+'/'+code,
     periodName:generateCode+'/'+periodName,
     monthly_status:'Open'}
 fiscalYearByMonthly.push(data);
  }
return fiscalYearByMonthly
}

// async createFiscalPeriod(query:any) :Promise<any> {
//   const startOfDate=query.fiscalPeriod?query.startOfDate:new Date();
// const endOfDate=query.endOfDate?query.endOfDate:new Date();
// const code=query.code?query.code:'';
// const status=query.status?query.status:'';
// const fiscalYear=query.fiscalYear?query.fiscalYear:'';
// const lines = query.lines ? query.lines : [];
// if(lines){
//   lines.map(async (line)=>{
//     let newFiscalPeriod:CreateFiscalPeriodDto={
//       startOfDate:line.startOfDate,
//       endOfDate:line.endOfDate,
//       monthly_code:line.monthly_code,
//       periodName:line.periodName,
//       monthly_status:line.monthly_status
//     }
//     let fiscalPeriod=await this.fiscalPeriod.create(newFiscalPeriod)
//     let createFiscalYearDto:CreateFiscalYearDto={
//       startDate:startOfDate,
//       endDate:endOfDate,
//       status:status,
//       code:code,
//       fiscalYear:fiscalYear,
//       monthlyPeriod:fiscalPeriod._id
//     }
//     await this.create(createFiscalYearDto)
//   })
// }
// return true;
// }

  async findOne(id: string): Promise<FiscalYear> {
    return await this.fiscalYearModel.findOne({ _id: id });
  }

  async update(id: string, updateFiscalYearDto: UpdateFiscalYearDto):Promise<FiscalYear> {
  //  let data={
  //   startOfPeriod:updateFiscalYearDto.startDate,
  //   endOfPeriod:updateFiscalYearDto.endDate,
  //   code:updateFiscalYearDto.code,
  //    monthly_status:updateFiscalYearDto.status,
  //    periodName:updateFiscalYearDto.fiscalYear
  //  }
  //  let monthdata=await this.findByMonthly(data)
  //  console.log(monthdata)
  //  updateFiscalYearDto.monthlyPeriod=monthdata
    await this.fiscalYearModel.findByIdAndUpdate(
      { _id: id },
      updateFiscalYearDto,
    );

    return this.findOne(id);
  }
  
  async remove(id: string): Promise<any> {
    const response = await this.fiscalYearModel.findByIdAndRemove({ _id: id });
    return response;
  }
  }
