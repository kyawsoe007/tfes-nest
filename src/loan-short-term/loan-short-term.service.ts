import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AccountItemService } from 'src/account-item/account-item.service';
import { FilterDto } from 'src/shared/filter.dto';
import { SupplierService } from 'src/supplier/supplier.service';
import { CreateLoanShortTermDto } from './dto/create-loan-short-term.dto';
import { UpdateLoanShortTermDto } from './dto/update-loan-short-term.dto';
import { LoanShortTerm } from './loan-short-term.interface';
import { JournalEntryService } from 'src/journal-entry/journal-entry.service';
import { CurrenciesService } from 'src/currencies/currencies.service';

@Injectable()
export class LoanShortTermService {
  constructor(
    @InjectModel('LoanShortTerm')
    private readonly loanShortTermModel: Model<LoanShortTerm>,
    private readonly accountItemService:AccountItemService,
    private readonly supplierService:SupplierService,
    private readonly journalEntryService:JournalEntryService,
    private readonly currencyService:CurrenciesService
  ) {}

  async create(
    createLoanShortTermDto: CreateLoanShortTermDto,
  ): Promise<LoanShortTerm> {
    //console.log('credt',createLoanShortTermDto)
    const payload =await new this.loanShortTermModel(createLoanShortTermDto).save();
    const findOne=await this.findOne(payload._id)
    return findOne;
  }

  async getfilters(query: FilterDto): Promise<any> {
    const limit = query.limit ? query.limit : 0;
    const skip = query.skip ? query.skip : 0;
    const filter = query.filter ? query.filter : [];
    const searchText = query.searchText ? query.searchText : '';
    const orderBy = query.orderBy ? query.orderBy : {paymentStartDate: -1};

    let where = {};
    const namedFilter = [];

    if (filter != null) {
      for (let i = 0; i < filter.length; i++) {
        const property = Object.keys(filter[i])[0];
        const propVal = Object.values(filter[i])[0];
        namedFilter.push( { [property] : propVal });
      }
    
    }

    if (namedFilter.length === 1) {
      where = namedFilter[0];
    } else if (namedFilter.length > 1) {
      where['$and'] = namedFilter;
    }

    if (searchText && searchText != '') {
      const searchPattern = new RegExp('.*' + searchText + '.*', 'i');
      const searchFilter = {
        $or: [
          { loanName: searchPattern }, 
          { bank: searchPattern }, 
        ],
      };
      if (where['$and']) {
        where['$and'].push(searchFilter);
      } else if (Object.keys(where).length > 0) {
        const temp = where;
        where = {};
        where['$and'] = [temp, searchFilter];
      } else {
        where = searchFilter;
      }
    }
    console.log(where);

    const loans = await this.loanShortTermModel
        .find(where)
        .skip(skip)
        .limit(limit)
        .sort(orderBy)
        .populate(['currency']);
    await Promise.all(
      loans.map(async(item)=>{
        try{
          if(item.debit_account){
            const accountItem=await this.accountItemService.findOne(item.debit_account)
            item.set('debit_account_name',accountItem.accountName,{strict:false});
          }
          if(item.credit_account){
            const accountItem=await this.accountItemService.findOne(item.credit_account)
            item.set('credit_account_name',accountItem.accountName,{strict:false});
          }
          if(item.interest_account){
            const accountItem=await this.accountItemService.findOne(item.interest_account)
            item.set('interest_account_name',accountItem.accountName,{strict:false})
          }
          if(item.suppId){
            const supplier=await this.supplierService.findOne(item.suppId)
            item.set('supplier_name',supplier.name,{strict:false})
          }
          let balance = item.loanAmount;
          if(item.loanList.length > 0){
             item.loanList.forEach(item => balance -= item.amount);
          }
          item.set("balance", balance, { strict: false });
        }
        catch(e){
          console.log(e)
        }
      })
    )

    const count = await this.loanShortTermModel.countDocuments(where);
    return [loans, count];

  }

  /*
  async findAll(): Promise<LoanShortTerm[]> {
    const result= await this.loanShortTermModel.find().exec();
    await Promise.all(
      result.map(async(item)=>{
        try{
          if(item.debit_account){
            const accountItem=await this.accountItemService.findOne(item.debit_account)
            item.set('debit_account_name',accountItem.accountName,{strict:false});
          }
          if(item.credit_account){
            const accountItem=await this.accountItemService.findOne(item.credit_account)
            item.set('credit_account_name',accountItem.accountName,{strict:false});
          }
          if(item.interest_account){
            const accountItem=await this.accountItemService.findOne(item.interest_account)
            item.set('interest_account_name',accountItem.accountName,{strict:false})
          }
          if(item.suppId){
            const supplier=await this.supplierService.findOne(item.suppId)
            item.set('supplier_name',supplier.name,{strict:false})
          }
        }
        catch(e){
          console.log(e)
        }
      })
    )
    return result
  }
*/

  async findOne(id: string): Promise<LoanShortTerm> {
    const result= await this.loanShortTermModel.findOne({ _id: id }).populate('currency');
    if(!result){
      throw new NotFoundException(`Loan Management doesn't exit`)
    }
    try{
      if(result.debit_account){
      const accountItem=await this.accountItemService.findOne(result.debit_account)
      result.set('debit_account_name',accountItem.accountName,{strict:false});
    }
    if(result.credit_account){
      const accountItem=await this.accountItemService.findOne(result.credit_account)
      result.set('credit_account_name',accountItem.accountName,{strict:false});
    }
    if(result.interest_account){
      const accountItem=await this.accountItemService.findOne(result.interest_account)
      result.set('interest_account_name',accountItem.accountName,{strict:false})
    }
    if(result.suppId){
      const supplier=await this.supplierService.findOne(result.suppId)
      result.set('supplier_name',supplier.name,{strict:false})
    }
    if(result.loanList.length>0){
      for(var loan of result.loanList){
        if(loan.account){
          const accountName=await this.accountItemService.findOne(loan.account);
          loan.set('accountName',accountName.accountName,{strict:false})
        }
      }
    }      
    }
    catch(e){
      console.log(e)
    }  
    console.log('result',result) 
    return result;
    //return await this.loanShortTermModel.findOne({ _id: id }).populate('currency');
  }

  async update(
    id: string,
    updateLoanShortTermDto: UpdateLoanShortTermDto,
  ): Promise<LoanShortTerm> {
    const response = await this.loanShortTermModel.findByIdAndUpdate(
      id,
      updateLoanShortTermDto,
      { new: true },
    ).exec();
    //console.log('value',updateLoanShortTermDto)
   // console.log(response);
    if(response.loanList.length > 0){
      if(response.loanList[0].journalId == undefined || response.loanList[0].journalId == ""){
        console.log("Creating journal");
        let journalItem = await this.createLoanJournalEntry(response);
        let loanList= [...response.loanList];
        loanList[0].journalId = journalItem._id;
        await this.loanShortTermModel.findByIdAndUpdate(id, { loanList: loanList});
      }
    }    
    const findOne=await this.findOne(response._id)
    return findOne;
  }

  async remove(id: string): Promise<any> {
    return await this.loanShortTermModel.findByIdAndRemove(id);
  }

  async setActive(id:string, active:boolean) {
    await this.loanShortTermModel.findByIdAndUpdate(id, { active: active});
  }

  async createLoanJournalEntry(journalEntry:LoanShortTerm){
    const journalItems=[];
    let loanAmount = journalEntry.loanList[0].amount;
    let interestAmount = journalEntry.loanList[0].interestAmount;
    let miscAmount = journalEntry.loanList[0].miscellaneous_amount ? journalEntry.loanList[0].miscellaneous_amount : 0;
    let loanAmountConverted = loanAmount;
    let interestAmountConverted = interestAmount;
    let miscAmountConverted = miscAmount;
    let currency;
    if(journalEntry.currency){
      //get the currency
      currency = await this.currencyService.findOne(journalEntry.currency);
      loanAmountConverted = loanAmount / currency.latestRate;
      interestAmountConverted = interestAmount / currency.latestRate;
      if(miscAmount > 0){
        miscAmountConverted = miscAmount / currency.latestRate;
      }
    }

    let secondLine={
      reference: '',
      name: journalEntry.loanName,
      partner: '',
      account: journalEntry.credit_account,
      dueDate: new Date(),
      debit: 0,
      credit: loanAmountConverted + interestAmountConverted + miscAmountConverted,
      amountCurrency: loanAmount + interestAmount + miscAmount,
      currency: currency ? currency._id : '',
      taxAmount: 0,
      reconcile: '',
      partialReconcile: '',
    }
    journalItems.push(secondLine);

    let firstLine={
      reference: '',
      name: journalEntry.loanName,
      partner: '',
      account: journalEntry.debit_account,
      dueDate: new Date(),
      debit: loanAmountConverted,
      credit: 0,
      amountCurrency: loanAmount,
      currency: currency ? currency._id : '',
      taxAmount: 0,
      reconcile: '',
      partialReconcile: '',
    }
    journalItems.push(firstLine);
    

    if(interestAmount > 0){
      let interestLine={
        reference: '',
        name: journalEntry.loanName,
        partner: '',
        account: journalEntry.interest_account,
        dueDate: new Date(),
        debit: interestAmountConverted,
        credit: 0,
        amountCurrency: interestAmount,
        currency: currency ? currency._id : '',
        taxAmount: 0,
        reconcile: '',
        partialReconcile: '',
      }
      journalItems.push(interestLine);
    }

    if(miscAmount > 0){
      let interestLine={
        reference: '',
        name: journalEntry.loanName,
        partner: '',
        account: journalEntry.loanList[0].account,
        dueDate: new Date(),
        debit: miscAmountConverted,
        credit: 0,
        amountCurrency: miscAmount,
        currency: currency ? currency._id : '',
        taxAmount: 0,
        reconcile: '',
        partialReconcile: '',
      }
      journalItems.push(interestLine);
    }

    const journalData={
      status:'draft',
      journalEntryNum:'',
      remarks:'',
      reference:journalEntry.loanName,
      toReview:false,
      totalCredit:loanAmountConverted + interestAmountConverted + miscAmountConverted,
      totalDebit:loanAmountConverted + interestAmountConverted + miscAmountConverted,
      journalValue:'',
      journalItems:journalItems?journalItems:[],
      entryDate:journalEntry.loanList[0].date,
      modelId:journalEntry._id,
    modelName:'LoanShortTerm'
    };

   return await this.journalEntryService.create(journalData);

  }
}
