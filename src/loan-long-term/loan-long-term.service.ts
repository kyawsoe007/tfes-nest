import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AccountItemService } from 'src/account-item/account-item.service';
import { JournalEntryService } from 'src/journal-entry/journal-entry.service';
import { CreateLoanLongTermDto } from './dto/create-loan-long-term.dto';
import { UpdateLoanLongTermDto } from './dto/update-loan-long-term.dto';
import { LoanLongTerm } from './loan-long-term.interface';
import { CurrenciesService } from 'src/currencies/currencies.service';
import * as moment from 'moment';
import { Cron } from '@nestjs/schedule';
import { SupplierInvoiceService } from 'src/supplier-invoice/supplier-invoice.service';
import { CreateSupplierInvoiceDto, SaleOrderItemsDto } from 'src/supplier-invoice/dto/create-supplier-invoice.dto';

@Injectable()
export class LoanLongTermService {
  constructor(
    @InjectModel('LoanLongTerm')
    private readonly loanLongTermModel: Model<LoanLongTerm>,
    private readonly accountItemService:AccountItemService,
    private readonly journalEntryService: JournalEntryService,
    private readonly currencyService: CurrenciesService,
    private readonly supplierInvoiceService:SupplierInvoiceService
  ) {}
  async create(
    createLoanLongTermDto: CreateLoanLongTermDto,
  ): Promise<LoanLongTerm> {
    const payload =await new this.loanLongTermModel(createLoanLongTermDto).save();
    if(payload.active){
      //immediately create journal entry
      this.createDepositJournal(payload);

    }
    const findOne=await this.findOne(payload._id)
    //console.log('findOne',findOne)
    return findOne;
  }

  //loan Calculation
  async findWithLoanList(res:any,endOfDate){
    var dates = [];
    const startDate=res.paymentStartDate;
    let endDate=endOfDate
    //if (res.depreciation_type == 'Monthly') {
      //endDate.setMonth(endDate.getMonth());
      var month = moment(startDate); //clone the startDate
      let duration = res.loanDuration * 12;
      
      let loanAmount=res.loanAmount
      if(loanAmount > 0){
      let IRM = res.interestRate / (12 * 100)
      let MI = ((loanAmount * IRM * (1 + IRM) ** duration) / ((1 + IRM) ** duration - 1));
      if(res.monthlyInstall > 0){
        MI = res.monthlyInstall;
      }
      for (month; month <= endDate;month.add(1,"month")) {
        console.log("month");
            // month.add(1, "month");
            let data = { loan_date: moment(new Date(month.year(),month.month(),1)).format('YYYY-MM-DD'), monthly_install: MI, interestPaid:0, balance_left: 0, journal: "" }
            dates.push(data);
            /*
            for(let j=0; j < res.loanJournalsCreated.length; j++){
              let journalDate = moment(res.loanJournalsCreated[j].date);
              if(journalDate.isSame(month, 'month')){
                let journal = await this.journalEntryService.findOne(res.loanJournalsCreated[j].journalId);
                if(journal.journalEntryNum){
                  data.journal = journal.journalEntryNum;                       
                }
                else {
                  data.journal = "added";
                }
              }
            }
            */
        }
        //let balance_left = dates[0].monthly_install * duration;
        let balance_left = loanAmount;          
        // for (var i = dates.length - 1; i >= 0; --i){          
        //     balance_left -= dates[i].monthly_install;
        //    dates[i].balance_left=balance_left 
        // }
        dates.map((item)=>{
          let interest = Math.round(balance_left * IRM *100)/100;
          let principalPaid = item.monthly_install - interest;
          if(balance_left - principalPaid > 0){
                            
            balance_left -= principalPaid;
            if(balance_left < item.monthly_install){
              let interestLeft =  Math.round(principalPaid * IRM *100)/100;
              interest += interestLeft;
              item.monthly_install += balance_left + interestLeft;
              balance_left = 0;
            }
          }
          item.interestPaid = interest;
          item.balance_left=balance_left 
        })
      }    
   return await dates.reverse()
 
}

  async findAll(): Promise<LoanLongTerm[]> {
    const result= await this.loanLongTermModel.find().exec();
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
          const findWithLoanList=await this.findWithLoanList(item,new Date());
          if(findWithLoanList.length > 0){
            item.set("outstanding_loan", findWithLoanList[0].balance_left, { strict: false});
            item.set("monthlyInstall", findWithLoanList[0].monthly_install, { strict: false });
          }
         
        }
        catch(e){
          console.log(e)
        }
      })
    )
    return result
  }

  async findOne(id: string): Promise<LoanLongTerm> {
    const result= await this.loanLongTermModel.findOne({ _id: id });
  if(!result){
    throw new NotFoundException(`Long Loan Management doesn't exit`)
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
  const end_of_date=new Date()
  const findWithLoanList=await this.findWithLoanList(result,end_of_date)
  result.set(`loanList`,findWithLoanList,{strict:false});
  }
  catch(e){
    console.log(e)
  }
  //console.log("result",result);
  return result
  }

  async update(
    id: string,
    updateLoanLongTermDto: UpdateLoanLongTermDto,
  ): Promise<LoanLongTerm> {
    const response = await this.loanLongTermModel.findByIdAndUpdate(
      id,
      updateLoanLongTermDto,
      { new: true },
    );
    if(updateLoanLongTermDto.active){
      //check if journal entry exists
      let journal = await this.journalEntryService.findOneWithModelId(id);
      if(!journal){
        this.createDepositJournal(response);
      }
    }
    const findOne=await this.findOne(response._id)
    
    return findOne;
  }

  async remove(id: string): Promise<any> {
    return await this.loanLongTermModel.findByIdAndRemove(id);
  }

  @Cron('00 06 * * * ')
 async findWithLoanDate(): Promise<LoanLongTerm[]> {
  let res=await this.loanLongTermModel.find()
  const endOfDate=new Date()
  for (let i = 0; i < res.length; i++){
    if(res[i].active){

      const findWithLoanList = await this.findWithLoanList(res[i], endOfDate);
      for(let j=0;j<findWithLoanList.length;j++){
        if(moment().isSame(findWithLoanList[j].loan_date, 'month')){
          
          let created = false;
          if(res[i].loanJournalsCreated){
            for(let k=0; k < res[i].loanJournalsCreated.length; k++){
              //change to search for invoices created
              let journalDate = moment(res[i].loanJournalsCreated[k].date);
              if(journalDate.isSame(findWithLoanList[j].loan_date, 'month')){
                created = true;
                break;
              }
            }
          }
          
          if(!created){
            /*
            let journal = await this.createLoanJournalEntry(res[i], findWithLoanList[0].interestPaid, findWithLoanList[0].monthly_install)
            let loanJournals = res[i].loanJournalsCreated;
            if(!loanJournals){
              loanJournals = [];
            }
            loanJournals.push({
              journalId: journal._id,
              date: endOfDate,
              amount: journal.totalCredit
            })

             //update 
             await this.loanLongTermModel.findByIdAndUpdate(res[i]._id, { loanJournalsCreated: loanJournals});             
             */

             //supplierInvoice create
             let loanJournals = res[i].loanJournalsCreated;
            if(!loanJournals){
              loanJournals = [];
            }
             let principal = findWithLoanList[j].monthly_install - findWithLoanList[j].interestPaid;             
             principal = Math.round(principal * 100) /100;
             let interest = Math.round((findWithLoanList[j].monthly_install - principal) * 100)/100;
             let saleItems = [];
             let item1 = new SaleOrderItemsDto();
             item1.SN = 1;
             item1.description = "Principal";
             item1.qty = 1;
             item1.unitPrice = principal;
             item1.extPrice = principal;
             item1.account = res[i].debit_account;
             saleItems.push(item1);
             let item2 = new SaleOrderItemsDto();
             item2.SN = 2;
             item2.description = "Interest paid";
             item2.qty = 1;
             item2.unitPrice = interest;
             item2.extPrice = interest;
             item2.account = res[i].interest_account;
             saleItems.push(item2);             
            let data = new CreateSupplierInvoiceDto();
            //get credit account name
            let creditAccountObject = await this.accountItemService.findOne(res[i].credit_account);
            data.invoiceDate = new Date(findWithLoanList[j].loan_date);
            data.account = res[i].credit_account;
            data.currency = res[i].currency;
            data.total = Math.round(findWithLoanList[j].monthly_install * 100)/100;
            data.grandTotal =Math.round(findWithLoanList[j].monthly_install * 100)/100;
            data.gst = 0;
            data.downPayment = 0;
            data.salesOrderItems = saleItems;
            data.gstAmount = 0;
            data.suppInvoiceNo = creditAccountObject.accountName;            
            /*
            let data={
              suppNo:"", 
              suppId:"", 
              suppName:"",
              soNumber:"",
              invoiceNumber:"", 
              invoiceDate:new Date(findWithLoanList[j].loan_date),
              account: res[i].credit_account,
              journal: '',
              status:"draft", 
              address:"", 
              telNo:"",
              faxNo:"",
              buyerName:"", 
              buyerEmail:"", 
              delAddress:"", 
              paymentAddress:"", 
              paymentTerm:"",
              currency:res[i].currency, 
              discount:"", 
              total:Number(findWithLoanList[j].monthly_install),
              gst:0,
              downPayment:0, 
              remarks:"", 
              salesOrderItems:dataItem, 
              exportLocal:"local", 
              gstAmount:0,
              toggleGenerateWO: false,
              toggleGeneratePO: false,
              suppInvoiceNo:'',
              discountAmount:0
            }
            */
            let newInvoice = await this.supplierInvoiceService.createNewInvoice(data);
            loanJournals.push({
              journalId: newInvoice._id,
              date: endOfDate,
              amount: newInvoice.total
            })

             //update 
             await this.loanLongTermModel.findByIdAndUpdate(res[i]._id, { loanJournalsCreated: loanJournals});  
          }

        
        }
      }

     
    }
    
  }
  return res
 }

 async createLoanJournalEntry(journalEntry:LoanLongTerm, interestPaid:number, installment:number){
  const journalItems=[];
  console.log("create loan");
  let interestRate = journalEntry.interestRate / 12;
       
  let loanPayment = installment - interestPaid;
  let interestAmountConverted = interestPaid;
  let loanPaymentConverted = loanPayment;
  let installmentConverted = installment;
  let currency;
  if(journalEntry.currency){
    currency = await this.currencyService.findOne(journalEntry.currency);
    loanPaymentConverted = loanPayment / currency.latestRate;
    interestAmountConverted = interestPaid / currency.latestRate;
    installmentConverted = installment / currency.latestRate;
  }



  let firstLine={
    reference: '',
    name: journalEntry.name,
    partner: '',
    account: journalEntry.debit_account,
    dueDate: new Date(),
    debit: installmentConverted,
    credit: 0,
    amountCurrency: installment,
    currency: currency ? currency._id : '',
    taxAmount: 0,
    reconcile: '',
    partialReconcile: '',
  }
  journalItems.push(firstLine);

  let secondLine={
    reference: '',
    name: journalEntry.name,
    partner: '',
    account: journalEntry.credit_account,
    dueDate: new Date(),
    debit: 0,
    credit: loanPaymentConverted,
    amountCurrency: loanPayment,
    currency: currency ? currency._id : '',
    taxAmount: 0,
    reconcile: '',
    partialReconcile: '',
  }
  journalItems.push(secondLine);

  let interestLine={
    reference: '',
    name: journalEntry.name,
    partner: '',
    account: journalEntry.interest_account,
    dueDate: new Date(),
    debit: 0,
    credit: interestAmountConverted,
    amountCurrency: interestPaid,
    currency: currency ? currency._id : '',
    taxAmount: 0,
    reconcile: '',
    partialReconcile: '',
  }
  journalItems.push(interestLine);

  const journalData={
    status:'draft',
    journalEntryNum:'',
    remarks:'',
    reference:journalEntry.name,
    toReview:false,
    totalCredit:installmentConverted,
    totalDebit:installmentConverted,
    journalValue:'',
    journalItems:journalItems?journalItems:[],
    entryDate:new Date(),
    modelId:journalEntry._id,
    modelName:'LoanLongTerm'
  };

 return await this.journalEntryService.create(journalData)
}

  async createDepositJournal(journalEntry:LoanLongTerm){
    const journalItems=[];
    console.log("create deposit")
    let loanAmountConverted = journalEntry.loanAmount;
    let currency;
    if(journalEntry.currency){
      currency = await this.currencyService.findOne(journalEntry.currency);
      loanAmountConverted = journalEntry.loanAmount / currency.latestRate;
    }

    let firstLine={
      reference: '',
      name: journalEntry.name,
      partner: '',
      account: journalEntry.credit_account,
      dueDate: new Date(),
      debit: 0,
      credit: loanAmountConverted,
      amountCurrency: journalEntry.loanAmount,
      currency: currency ? currency._id : '',
      taxAmount: 0,
      reconcile: '',
      partialReconcile: '',
    }
    journalItems.push(firstLine);

    let secondLine={
      reference: '',
      name: journalEntry.name,
      partner: '',
      account: journalEntry.debit_account,
      dueDate: new Date(),
      debit: loanAmountConverted,
      credit: 0,
      amountCurrency: journalEntry.loanAmount,
      currency: currency ? currency._id : '',
      taxAmount: 0,
      reconcile: '',
      partialReconcile: '',
    }
    journalItems.push(secondLine);

    const journalData={
      status:'draft',
      journalEntryNum:'',
      remarks:'',
      reference:journalEntry.name,
      toReview:false,
      totalCredit:loanAmountConverted,
      totalDebit:loanAmountConverted,
      journalValue:'',
      journalItems:journalItems?journalItems:[],
      entryDate:journalEntry.loanDepositDate,
      modelId:journalEntry._id,
      modelName:'LoanLongTerm'
    };
  
   return await this.journalEntryService.create(journalData)
  }
  

}
