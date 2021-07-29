import { CapexManagement } from './capex-management.interface';
import { Injectable, NotFoundException,Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateCapexManagementDto } from './dto/create-capex-management.dto';
import { UpdateCapexManagementDto } from './dto/update-capex-management.dto';
import { Model } from 'mongoose';
import * as moment from 'moment';
import { AccountItemService } from 'src/account-item/account-item.service';
import { JournalEntryService } from 'src/journal-entry/journal-entry.service';
import { SupplierInvoiceService } from 'src/supplier-invoice/supplier-invoice.service';
import { CreateSupplierInvoiceDto, SaleOrderItemsDto } from 'src/supplier-invoice/dto/create-supplier-invoice.dto';
import { Cron } from '@nestjs/schedule';
@Injectable()
export class CapexManagementService {
  constructor(
   @InjectModel('CapexManagement') 
   private readonly capexManagementModel: Model<CapexManagement>,
   private readonly accountItemService:AccountItemService,
   private readonly journalEntryService:JournalEntryService,
   private readonly supplierInvoiceService:SupplierInvoiceService
 ){}
 
  async create(createCapexManagementDto: CreateCapexManagementDto) {
   const newCapex=new this.capexManagementModel(createCapexManagementDto)
    let newData= await newCapex.save();
    if(newData.active){
      this.createDepositJournal(newData);
    }
    
  return await this.findOne(newData._id)
  }

  async findAll(): Promise<CapexManagement[]> {
    const res = await this.capexManagementModel.find()

    const todayDate = moment();
    for (let i = 0; i < res.length; i++){
      let purchaseDate = moment(res[i].purchase_date);
      let months_passed = todayDate.diff(purchaseDate, 'months');
      let months_left = res[i].life_span * 12 - months_passed;
      let yearsLeft = Math.floor(months_left/12) +"yrs "+Math.round(months_left % 12) +" mths";
      res[i].set("months_left", yearsLeft, { strict : false});
      const findWithLoanList=await this.findWithLoanList(res[i],new Date());
      if(findWithLoanList.length > 0){
        res[i].set("outstanding_loan", findWithLoanList[0].balance_left, { strict: false});
      res[i].set("monthly_installment", findWithLoanList[0].monthly_install, { strict: false });
      }
      
    }
    return res;
  }

  async findOne(id: string):Promise<CapexManagement> {
    const res = await this.capexManagementModel.findById(id);
    const endOfDate=new Date()
const findWithCapexList=await this.findWithCapexList(res,endOfDate)
const findWithLoanList=await this.findWithLoanList(res,endOfDate)
res.set(`CapexList`,findWithCapexList,{strict:false});
res.set(`LoanList`,findWithLoanList,{strict:false});
    return res
  }

  async findWithCapexList(res:CapexManagement,endOfDate){
    var dates = [];
    let startDate=res.purchase_date
    let endDate=endOfDate
         if (res.depreciation_type == 'Monthly') {
             endDate.setMonth(endDate.getMonth());
             var month = moment(startDate); //clone the startDate
             for (month; month <= endDate;month.add(1,"month")) {
                //  month.add(1, "month");
                 let depreciation = Math.round((res.purchase_value-res.residual_amount) / (res.life_span * 12) * 100)/100;
                 let data = { date: moment(new Date(month.year(),month.month(),month.date())).format('YYYY-MM-DD'), depreciation: depreciation, value_left: 0, journal: '' }
                 //check if journal entry created
                 for(let j=0; j < res.journalsCreated.length; j++){
                   let journalDate = moment(res.journalsCreated[j].date);
                   if(journalDate.isSame(month, 'month') ){
                     try {
                      let journal = await this.journalEntryService.findOne(res.journalsCreated[j].journalId);
                      if(journal.journalEntryNum){
                        data.journal = journal.journalEntryNum;                       
                      }
                      else {
                        data.journal = "added";
                      }
                     }
                     catch(error){
                       console.log("journal was deleted");
                     }
                     
                   }
                 }
                 dates.push(data);                 
             }
         }
         else {
            endDate.setYear(endDate.getFullYear());
            var year = moment(startDate); //clone the startDate            
            for (year;year <= endDate;year.add(1,"year")) {
                
                // year.add(1, "year");
                let depreciation = Math.round((res.purchase_value-res.residual_amount) / res.life_span * 100)/100
                let data = { date: moment(new Date(year.year(),year.month(),1)).format('YYYY-MM-DD'), depreciation: depreciation, value_left: 0, journal: "" }
                for(let j=0; j < res.journalsCreated.length; j++){
                  let journalDate = moment(res.journalsCreated[j].date);
                  if(journalDate.isSame(month, 'month')){
                    try {
                      let journal = await this.journalEntryService.findOne(res.journalsCreated[j].journalId);
                      if(journal.journalEntryNum){
                        data.journal = journal.journalEntryNum;                       
                      }
                      else {
                        data.journal = "added";
                      }
                    }
                    catch(error){
                      console.log("journal was deleted");
                    }
                    
                  }
                }

                dates.push(data);
            }
         }
         dates.map((item,index)=>{
          let valueleft=res.purchase_value-item.depreciation*index
        item.value_left=valueleft
        })
        //  for (var i = dates.length - 1; i >= 0; --i){
        //      let value_left = res.purchase_value -= dates[i].depreciation
             
        //     dates[i].value_left=value_left 
        //  }
        //  console.log('startD',startDate)
        //  console.log('end',endDate)
        return await dates.reverse()
  }

  async findWithLoanList(res:CapexManagement,endOfDate){
      var dates = [];
      
      let startDate=res.payment_startdate
    let endDate=endOfDate
      //if (res.depreciation_type == 'Monthly') {
        //endDate.setMonth(endDate.getMonth());
        var month = moment(startDate); //clone the startDate
        let duration = res.loan_duration * 12;
        
        let loanAmount=res.loan_amount
        if(loanAmount > 0){
          let IRM = res.interest_rate / (12 * 100)
          let MI = (loanAmount * IRM * (1 + IRM) ** duration) / ((1 + IRM) ** duration - 1);
          if(res.loan_installment){
            MI = res.loan_installment;
          }
          for (month; month <= endDate;month.add(1,"month")) {
                // month.add(1, "month");
                let data = { loan_date: moment(new Date(month.year(),month.month(),month.date())).format('YYYY-MM-DD'), monthly_install: MI, interestPaid:0, balance_left: 0, journal: "" }
                /*
                for(let j=0; j < res.loanJournalsCreated.length; j++){
                  let journalDate = moment(res.loanJournalsCreated[j].date);
                  if(journalDate.isSame(month, 'month')){
                    try {
                      let journal = await this.journalEntryService.findOne(res.loanJournalsCreated[j].journalId);
                    if(journal.journalEntryNum){
                      data.journal = journal.journalEntryNum;                       
                    }
                    else {
                      data.journal = "added";
                    }
                    }
                    catch(error){
                      console.log("journal removed");
                    }
                    
                  }
                }
                */
                dates.push(data);
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
              if(balance_left - item.monthly_install > 0){
                                
                balance_left -= item.monthly_install;
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

  @Cron('30 23 * * * ')
 async findWithPurchaseDate(): Promise<CapexManagement[]> {
  let res=await this.capexManagementModel.find()
  const endOfDate=new Date()
  for (let i = 0; i < res.length; i++){
    if(res[i].active){
      const findWithCapexList=await this.findWithCapexList(res[i],endOfDate)
      for(let j=0;j<findWithCapexList.length;j++){
        //is day is the same and check if already created.
        if(moment().isSame(findWithCapexList[j].date, 'month')){
          let created = false;
          if(res[i].journalsCreated){
            for(let k=0; k < res[i].journalsCreated.length; k++){
              let journalDate = moment(res[i].journalsCreated[k].date);
              if(journalDate.isSame(findWithCapexList[j].date, 'month')){
                created = true;
                break;
              }
            }
          }
          
          if(!created){
            let journal = await this.createJournalEntry(res[i])
            let capexJournals = res[i].journalsCreated;
            capexJournals.push({
              journalId: journal._id,
              date: endOfDate,
              amount: journal.totalCredit
            })
            console.log(journal._id);

             //update 
            await this.capexManagementModel.findByIdAndUpdate(res[i]._id, { journalsCreated: capexJournals});

          }
        
        }

      }

      const findWithLoanList = await this.findWithLoanList(res[i], endOfDate);
      for(let j=0;j<findWithLoanList.length;j++){
        console.log(findWithLoanList[j].loan_date);
        if(moment().isSame(findWithLoanList[j].loan_date, 'month')){
          
          let created = false;
          if(res[i].loanJournalsCreated){
            for(let k=0; k < res[i].loanJournalsCreated.length; k++){
              let journalDate = moment(res[i].loanJournalsCreated[k].date);
              if(journalDate.isSame(findWithLoanList[j].loan_date, 'month')){
                created = true;
                break;
              }
            }
          }
          
          if(!created){
            //let journal = await this.createLoanJournalEntry(res[i], findWithLoanList[0].interestPaid, findWithLoanList[0].monthly_install)
            let capexJournals = res[i].loanJournalsCreated;
            if(!capexJournals){
              capexJournals = [];
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
            item1.account = res[i].loan_debit_account;
            saleItems.push(item1);
            let item2 = new SaleOrderItemsDto();
            item2.SN = 2;
            item2.description = "Interest paid";
            item2.qty = 1;
            item2.unitPrice = interest;
            item2.extPrice = interest;
            item2.account = res[i].loan_interest_account;
            saleItems.push(item2);             
           let data = new CreateSupplierInvoiceDto();
           //get credit account name
           let creditAccountObject = await this.accountItemService.findOne(res[i].credit_account);
           data.invoiceDate = new Date(findWithLoanList[j].loan_date);
           data.account = res[i].loan_credit_account;          
           data.total = Math.round(findWithLoanList[j].monthly_install * 100)/100;
           data.grandTotal =Math.round(findWithLoanList[j].monthly_install * 100)/100;
           data.gst = 0;
           data.downPayment = 0;
           data.salesOrderItems = saleItems;
           data.gstAmount = 0;
           data.suppInvoiceNo = creditAccountObject.accountName;
           let newInvoice = await this.supplierInvoiceService.createNewInvoice(data);
            capexJournals.push({
              journalId: newInvoice._id,
              date: endOfDate,
              amount: newInvoice.total
            })

             //update 
             await this.capexManagementModel.findByIdAndUpdate(res[i]._id, { loanJournalsCreated: capexJournals});
          }
        
        }
      }

     
    }
    
  }
  return res
 }


async update(id: string, updateCapexManagementDto: UpdateCapexManagementDto):Promise<CapexManagement> {
  console.log(id);
  const editCapex = await this.capexManagementModel.findByIdAndUpdate(
    {_id:id},
    updateCapexManagementDto,
    { new: true },
  );
  if(updateCapexManagementDto.active){
    let journal = await this.journalEntryService.findOneWithModelId(id);
    if(!journal){
      this.createDepositJournal(editCapex);
    }
  }

  return await this.findOne(id);
  }

  async remove(id: string) {
    const deleteCapex = await this.capexManagementModel.findByIdAndRemove(id);
    return deleteCapex
  }


 
  async createJournalEntry(journalEntry:any){
    const journalItems=[];
    let taxAmt=0;
    let lifespan = journalEntry.life_span;
    if(journalEntry.depreciation_type == "Monthly"){
      lifespan = lifespan * 12;
    }
     let depreciation = Math.round((journalEntry.purchase_value-journalEntry.residual_amount) / lifespan * 100) /100 ;    

     //debit and credit not named properly, have to swap them around
    let firstLine={
      reference: '',
      name: journalEntry.name,
      partner: '',
      account: journalEntry.credit_account,
      dueDate: new Date(),
      debit: depreciation,
      credit: 0,
      amountCurrency: depreciation,
      currency: '',
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
      debit: 0,
      credit: depreciation,
      amountCurrency: depreciation,
      currency: '',
      taxAmount: 0,
      reconcile: '',
      partialReconcile: '',
    }
    journalItems.push(secondLine);

    const journalData={
      status:'draft',
      journalEntryNum:'',
      remarks:journalEntry.remarks,
      reference:journalEntry.name,
      toReview:false,
      totalCredit:depreciation,
      totalDebit:depreciation,
      journalValue:'',
      journalItems:journalItems?journalItems:[],
      entryDate:new Date(),
      modelId:journalEntry._id,
      modelName:'Capex'
    };

   return await this.journalEntryService.create(journalData)
  }

  async createLoanJournalEntry(journalEntry:CapexManagement, interestPaid:number, installment:number){
    const journalItems=[];

    let interestRate = journalEntry.interest_rate / 12;    
    //let interestAmount = Math.round( (balance + installment) * interestRate)/100;
    
    let loanPayment = installment - interestPaid;
    console.log(loanPayment);

    let firstLine={
      reference: '',
      name: journalEntry.name,
      partner: '',
      account: journalEntry.loan_debit_account,
      dueDate: new Date(),
      debit: installment,
      credit: 0,
      amountCurrency: installment,
      currency: '',
      taxAmount: 0,
      reconcile: '',
      partialReconcile: '',
    }
    journalItems.push(firstLine);

    let secondLine={
      reference: '',
      name: journalEntry.name,
      partner: '',
      account: journalEntry.loan_credit_account,
      dueDate: new Date(),
      debit: 0,
      credit: loanPayment,
      amountCurrency: loanPayment,
      currency: '',
      taxAmount: 0,
      reconcile: '',
      partialReconcile: '',
    }
    journalItems.push(secondLine);

    let interestLine={
      reference: '',
      name: journalEntry.name,
      partner: '',
      account: journalEntry.loan_interest_account,
      dueDate: new Date(),
      debit: 0,
      credit: interestPaid,
      amountCurrency: interestPaid,
      currency: '',
      taxAmount: 0,
      reconcile: '',
      partialReconcile: '',
    }
    journalItems.push(interestLine);

    const journalData={
      status:'draft',
      journalEntryNum:'',
      remarks:journalEntry.remarks,
      reference:journalEntry.name,
      toReview:false,
      totalCredit:installment,
      totalDebit:installment,
      journalValue:'',
      journalItems:journalItems?journalItems:[],
      entryDate:new Date(),
      modelId:journalEntry._id,
      modelName:'Capex'
    };

   return await this.journalEntryService.create(journalData)
  }

  async createDepositJournal(journalEntry:CapexManagement){
    const journalItems=[];
    console.log("create deposit")    
    //let loanAmountConverted = journalEntry.loan_amount;
    let itemValue = 0;
    if(journalEntry.purchase_value > 0){
      //excess = purchase value - loan amount
      //loan should not exceed purchase value
      itemValue = journalEntry.purchase_value > journalEntry.loan_amount ? journalEntry.purchase_value : journalEntry.loan_amount;
      let itemExcess = journalEntry.purchase_value > journalEntry.loan_amount ? journalEntry.purchase_value - journalEntry.loan_amount : 0;


  
      let firstLine={
        reference: '',
        name: journalEntry.name,
        partner: '',
        account: journalEntry.debit_account,
        dueDate: new Date(),
        debit: itemValue,
        credit: 0,
        amountCurrency: itemValue,
        currency: '',
        reconcile: '',
        partialReconcile: '',
      }
      journalItems.push(firstLine);
      if(itemExcess > 0){
        let secondLine={
          reference: '',
          name: journalEntry.name,
          partner: '',
          account: journalEntry.loan_debit_account,
          dueDate: new Date(),
          debit: 0,
          credit: itemExcess,
          amountCurrency: itemExcess,
          currency: '',
          reconcile: '',
          partialReconcile: '',
        }
        journalItems.push(secondLine);
      }      
    }
    
    if(journalEntry.loan_amount > 0){
      let firstLine={
        reference: '',
        name: journalEntry.name,
        partner: '',
        account: journalEntry.loan_credit_account,
        dueDate: new Date(),
        debit: 0,
        credit:  journalEntry.loan_amount,
        amountCurrency: journalEntry.loan_amount,
        currency: '',
        taxAmount: 0,
        reconcile: '',
        partialReconcile: '',
      }
      journalItems.push(firstLine);
  
              
    
     
    }

    const journalData={
      status:'draft',
      journalEntryNum:'',
      remarks:'',
      reference:journalEntry.name,
      toReview:false,
      totalCredit:itemValue,
      totalDebit:itemValue,
      journalValue:'',
      journalItems:journalItems?journalItems:[],
      entryDate:journalEntry.purchase_date,
      modelId:journalEntry._id,
      modelName:'Capex'
    };
    return await this.journalEntryService.create(journalData)
  }
 
}
