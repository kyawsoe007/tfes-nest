import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AccountItemService } from 'src/account-item/account-item.service';
import { JournalEntryService } from 'src/journal-entry/journal-entry.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import * as moment from 'moment';

@Injectable()
export class ReportsService {
  constructor(private readonly journalEntryService: JournalEntryService) {}

  create(createReportDto: CreateReportDto) {
    return 'This action adds a new report';
  }

  findAll() {
    return `This action returns all reports`;
  }

  findOne(id: number) {
    return `This action returns a #${id} report`;
  }

  update(id: number, updateReportDto: UpdateReportDto) {
    return `This action updates a #${id} report`;
  }

  remove(id: number) {
    return `This action removes a #${id} report`;
  }

  async generatePDF(query:any){
return await this.journalEntryService.getAllJournalItemsWithAccountId(query.startDate,query.endDate)
  }

  async gstReport(query:any){
    return await this.journalEntryService.getAllJournalEntryWithTaxes(query.startDate,query.endDate);
  }

  async getTrialBalance(query:any){    
    return await this.journalEntryService.getTrialBalanceData(query.startDate,query.endDate);
  }

  async getPNLReport(query: any){
    
    let data = await this.journalEntryService.calculatePL(query.startDate, query.endDate);
    let returnData = [];
    let startDatestr = "";
    if(query.startDate){
      startDatestr = moment(query.startDate).format("DD/MM/YYYY");
    }
    let endDatestr = "";
    if(query.endDate){
      endDatestr = moment(query.endDate).format("DD/MM/YYYY");
    }
    returnData.push({
      column1: "PROFIT & LOSS REPORT"
    });
    returnData.push(
      {column1: "Start Date",
      column2: startDatestr,
      column3: "End Date",
      column4: endDatestr
      });
    returnData.push({
      column1: ""
    });
    let keys = Object.keys(data);
    let totalSales = 0;
    let totalCogs = 0;
    let totalOther = 0;
    let totalExpense = 0;
    let totalPbt = 0;
    for(let i=0; i < keys.length; i++){
      returnData.push({
        column1: keys[i].toUpperCase()
      })
      for(let j=0; j < data[keys[i]].length; j++){
        returnData.push({
          column1: data[keys[i]][j].code,
          column2: data[keys[i]][j].name,
          column3: data[keys[i]][j].amount
        });
        if(i == 0){
          totalSales += data[keys[i]][j].amount;
        }
        else if(i==1){
          totalCogs += data[keys[i]][j].amount;
        }
        else if(i==2){
          totalOther += data[keys[i]][j].amount;
        }
        else if(i == 3){
          totalExpense += data[keys[i]][j].amount;
        }
        else if(i == 4){
          totalPbt += data[keys[i]][j].amount;
        }
        
      }

      if(i == 1){

        returnData.push({
          column2: "GP",
          column3: totalSales - totalCogs
        })
        returnData.push({
          column1: ""
        })
      }
      else if(i == 2){
        returnData.push({
          column2: "Total Other Income",
          column3: totalOther
        });
        returnData.push({
          column1: ""
        });
        returnData.push({
          column2: "GROSS PROFIT",
          column3: totalSales + totalOther - totalCogs
        })
        returnData.push({ column1: ""});
      }
      else if(i == 3){
        returnData.push({
          column2: "Total Expenses",
          column3: totalExpense
        });
        returnData.push({
          column2: "EBITA",
          column3: totalSales + totalOther - totalCogs - totalExpense
        });
        returnData.push({ column1: ""});
      }
    }
    returnData.push({
      column2: "PBT",
      column3: totalSales + totalOther - totalCogs - totalExpense - totalPbt
    })
    return returnData;
  }

  async getBalanceSheet(query: any){
    let data = await this.journalEntryService.getBalanceSheet(query.startDate, query.endDate);
    let returnData = [];
    let startDatestr = "";
    if(query.startDate){
      startDatestr = moment(query.startDate).format("DD/MM/YYYY");
    }
    let endDatestr = "";
    if(query.endDate){
      endDatestr = moment(query.endDate).format("DD/MM/YYYY");
    }
    returnData.push({
      column1: "BALANCE SHEET"
    });
    returnData.push(
      {column1: "Start Date",
      column2: startDatestr,
      column3: "End Date",
      column4: endDatestr
      });
      returnData.push({column1: ""})
      let currentAssetTotal = 0;
      let fixedAssetTotal = 0;
      let currentLiabilityTotal = 0;
      let longLiabilityTotal = 0;
      let capTotal = 0;
      let internalType = "";
    console.log(data);
    for(let i=0; i < data.length; i++){
      if(internalType != data[i].internalType){
        internalType = data[i].internalType;
        
        if(internalType == "Fixed Assets"){
          returnData.push({column1: ""});
          returnData.push({column1: "TOTAL CURRENT ASSETS", column2: currentAssetTotal});
          returnData.push({column1: ""});
        }
        else if(internalType == "Current Liabilities"){
          returnData.push({column1: ""});
          returnData.push({column1: "TOTAL FIXED ASSETS", column2: fixedAssetTotal});
          returnData.push({column1: ""});
          returnData.push({column1: "TOTAL ASSETS", column2: currentAssetTotal + fixedAssetTotal});
          returnData.push({column1: ""});
        }
        else if(internalType == "Long Term Liabilities"){
          returnData.push({column1: ""});
          returnData.push({column1: "TOTAL CURRENT LIABILITIES", column3: currentLiabilityTotal});
          returnData.push({column1: ""});
        }
        else if(internalType == "Capital"){
          returnData.push({column1: ""});
          returnData.push({column1: "TOTAL LONG TERM LIABILITIES", column3: longLiabilityTotal});
          returnData.push({column1: ""});
                    
        }
        returnData.push({column1: internalType.toUpperCase()});
      }
      let level1 = data[i].get("LevelOne");
      if(level1 && level1.accountName){
        if(data[i].internalType.includes("Asset")){
          returnData.push({ column1: level1.accountName, column2: data[i].get("amount")});
          returnData.push({column1: ""});
          if(data[i].internalType == "Current Assets"){
            currentAssetTotal += data[i].get("amount");
          }
          else {
            fixedAssetTotal += data[i].get("amount");
          }
        }
        else {
          returnData.push({ column1: data[i].LevelOne.accountName, column3: data[i].get("amount")});
          returnData.push({column1: ""});
          if(data[i].internalType == "Current Liabilities"){
            currentLiabilityTotal += data[i].get("amount");
          }
          else if(data[i].internalType == "Long Term Liabilities") {
            fixedAssetTotal += data[i].get("amount");
          }
          else {
            capTotal += data[i].get("amount");
          }
        }
      }
      else {
        returnData.push({ column1: data[i].get("LevelOne")});        
        
        for(let j=0;j < data[i].levelTwo.length; j++){
          //console.log(data[i].levelTwo[j]);
          let amount = data[i].levelTwo[j].get("amount");
          let level2 = data[i].levelTwo[j].get("accountName");
          if(amount && level2){
                     
            if(data[i].internalType.includes("Asset")){
              returnData.push({ column1: level2, column2: amount});
              if(data[i].internalType == "Current Assets"){
                currentAssetTotal += amount;
              }
              else {
                fixedAssetTotal += amount;
              }
            }
            else {
              returnData.push({ column1: level2, column3: amount});
              if(data[i].internalType == "Current Liabilities"){
                currentLiabilityTotal += amount;
              }
              else if(data[i].internalType == "Long Term Liabilities") {
                fixedAssetTotal += amount;
              }
              else {
                capTotal += amount;
              }
            }
          }
        }
        
        returnData.push({column1: ""});
      }
      
    }
    returnData.push({column1: ""});
    returnData.push({column1: "SHAREHOLDERS EQUITY & LIABILITIES", column3: currentLiabilityTotal + longLiabilityTotal + capTotal});
    returnData.push({column1: ""});

    console.log(returnData);
    return returnData;  
  }
}
