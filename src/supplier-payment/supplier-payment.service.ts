import {
  ForbiddenException, forwardRef,
  HttpException, Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose'; // Added new Line

import { Model } from 'mongoose'; // Added new line
import { CreateSupplierPaymentDto } from './dto/create-supplier-payment.dto';
import { UpdateSupplierPaymentDto } from './dto/update-supplier-payment.dto';
import { SequenceSettingsService } from 'src/sequence-settings/sequence-settings.service';
import { SupplierPayment } from './interfaces/supplier-payment.interface';
import {FilterDto} from "../shared/filter.dto";
import { ReconcileService } from 'src/reconcile/reconcile.service';
import { SupplierInvoiceService } from './../supplier-invoice/supplier-invoice.service';
import { InvoicesService } from 'src/invoices/invoices.service';
import { PaymentMethodService } from 'src/payment-method/payment-method.service';
import { AccountItemService } from 'src/account-item/account-item.service';
import { JournalEntryService } from 'src/journal-entry/journal-entry.service';
import { DebitNoteService } from 'src/debit-note/debit-note.service';
import { CreditNoteService } from 'src/credit-note/credit-note.service';
import { PaymentDepositService } from 'src/payment-deposits/payment-deposit.service';
import { LoanShortTermService } from 'src/loan-short-term/loan-short-term.service';
import { InvoiceStatusEnum } from 'src/invoices/dto/create-invoice.dto';

@Injectable()
// List of methods of queries to access to database with Respository
export class SupplierPaymentService {
  // added constructor
  constructor(
    @InjectModel('SupplierPayment')
    private readonly paymentModel: Model<SupplierPayment>,
    private readonly sequenceSettingsService: SequenceSettingsService,
    @Inject(forwardRef(() => SupplierInvoiceService))
    private readonly invoicesService: SupplierInvoiceService,
    @Inject(forwardRef(() => InvoicesService))
    private readonly custInvoiceService: InvoicesService,
    @Inject(forwardRef(() => ReconcileService))
    private readonly reconcileService: ReconcileService,
    private readonly journalEntryService: JournalEntryService,
    private readonly accountItemService: AccountItemService,
    private readonly paymentMethodService: PaymentMethodService,
    private readonly debitNoteService: DebitNoteService,
    private readonly creditNoteService: CreditNoteService,
    private readonly paymentDepositService: PaymentDepositService,
    private readonly loanShortTermService: LoanShortTermService
  ) {}

  // Create New reconcile
  async createNewPayment(
    createSupplierPaymentDto: CreateSupplierPaymentDto
  ): Promise<any> {
    let data = createSupplierPaymentDto;
    let reconciles = createSupplierPaymentDto.invoices;
    let debitNotes = createSupplierPaymentDto.debitNotes;
    delete data.invoices;
    delete data.debitNotes;
    data.draftInvoices = reconciles;
    data.draftDebitNotes = debitNotes;

    const newPayment = new this.paymentModel(data);
    let createdPayment = await newPayment.save();
    let paymentReturnValue = createdPayment;
    delete paymentReturnValue.draftInvoices;
    delete paymentReturnValue.draftDebitNotes;
    await Promise.all(createdPayment.draftInvoices.map(async inv => {
      switch(inv.modelName){ 
        case "credit-note":
          let credit = await this.creditNoteService.findOne(inv.modelId);
          inv.set("currency", credit.currency, { strict: false });
          break;
        case "supplierinvoice":
          let suppinv = await this.invoicesService.findOne(inv.modelId);
          inv.set("currency", suppinv.currency, { strict: false });
          inv.set("soNumber", suppinv.soNumber, { strict: false });
          break;
        case "customer-deposit":
          let deposit = await this.paymentDepositService.findOne(inv.modelId);
          inv.set("currency", deposit.currency, { strict: false});
          break;
      }
    }));
    await Promise.all( createdPayment.draftDebitNotes.map(async cred => {
      switch(cred.modelName){
        case "invoice":
          let invoice = await this.custInvoiceService.findOne(cred.modelId);
          cred.set("currency", invoice.currency, { strict: false });
          break;
        case "debit-note":
          let debit = await this.debitNoteService.findOne(cred.modelId);
          cred.set("currency", debit.currency, { strict: false});
          break;
        case "supplier-deposit":
          let deposit = await this.paymentDepositService.findOne(cred.modelId);
          cred.set("currency", deposit.currency, { strict: false});
          break;
        
      }
      
    }));

    const returnResult = {
      payment: paymentReturnValue,
      invoices: createdPayment.draftInvoices,
      debitNotes: createdPayment.draftDebitNotes
    };
    
    return returnResult;
  }

  async getfilters(query: FilterDto): Promise<any> {
    const limit = query.limit ? query.limit : 0;
    const skip = query.skip ? query.skip : 0;
    const filter = query.filter ? query.filter : [];
    const searchText = query.searchText ? query.searchText : '';
    const orderBy =  query.orderBy && Object.keys(query.orderBy).length > 0
    ? query.orderBy
    : { paymentNo: -1 };

    let where = {};
    const namedFilter = [];

    if (filter != null) {
      for (let i = 0; i < filter.length; i++) {
        const property = Object.keys(filter[i])[0];
        const propVal = Object.values(filter[i])[0];
        if (property === 'status') {
          if (propVal !== '') {
            if (Array.isArray(propVal)) {
              //if in array
              const soStatusArray = propVal as Array<string>;
              const salesOrderFound = await this.paymentModel.find({
                status: { $in: soStatusArray },
              });
              // map - get each status - push each into array object
              const soStatus = salesOrderFound.map((item) => item.status);
              namedFilter.push({ status: { $in: soStatus } });
            } else {
              // if not in Array
              namedFilter.push({ status: propVal });
            }
          }
        } else if (property === 'total') {
          if (Array.isArray(propVal)) {
            if (propVal[0] === '') {
              // if min field is empty, filter (less than)
              namedFilter.push({ total: { $lte: parseInt(propVal[1]) } });
            } else if (propVal[1] === '') {
              // if max field is empty, filter (greater than)
              namedFilter.push({ total: { $gte: parseInt(propVal[0]) } });
            } else {
              // else filter (greater and lesser)
              namedFilter.push({
                total: {
                  $gte: parseInt(propVal[0]),
                  $lte: parseInt(propVal[1]),
                },
              });
            }
          }
        } else if (property === 'paymentDate') {
          if (Array.isArray(propVal)) {
            if (propVal[0] === 0) {
              // if Min field is empty, filter lesser
              namedFilter.push({ paymentDate: { $lte: propVal[1] } });
            } else {
              // if Min field is not empty, filter greater and lesser
              // https://stackoverflow.com/questions/55108562/why-does-eq-comparison-is-not-working-on-mongodb-with-dates
              let upperBoundDate = new Date(propVal[1]);
              upperBoundDate.setDate(upperBoundDate.getDate() + 1)
              namedFilter.push({
                paymentDate: { $gte: propVal[0], $lte: upperBoundDate },
              })
            }
          } else {
            // if Max field is empty, it is not in Array
            namedFilter.push({ paymentDate: { $gte: propVal } });
          }
        }
      }
    }

    if (namedFilter.length === 1) {
      where = namedFilter[0];
    } else if (namedFilter.length > 1) {
      where['$and'] = namedFilter;
    }

    //Search and matching
    if (searchText && searchText != '') {
      const searchPattern = new RegExp('.*' + searchText + '.*', 'i');
      const searchFilter = {
        $or: [
          { invoiceNumber: searchPattern }, // Invoice Number
          { suppName: searchPattern }, // Customer name
          { paymentNo: searchPattern }, // Payment No 
          { paymentRef: searchPattern }, // Payment Ref
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

    const invoices = await this.paymentModel
        .find(where)
        .skip(skip)
        .limit(limit)
        .sort(orderBy)
        .populate(['currency', 'paymentTerm', 'paymentMethod']);

    const count = await this.paymentModel.countDocuments(where);
    return [invoices, count];
  }

  async getOnePayment(id: string): Promise<any> {
    let invoices = [];
    let debitNotes = [];
    let combinedDebit = [];
    let reconcileResult;
    let paymentResult = await this.paymentModel.findOne({_id: id});

    if (paymentResult.status === 'draft') {
        invoices = paymentResult.draftInvoices;
        combinedDebit = paymentResult.draftDebitNotes;
        delete paymentResult.draftInvoices;
        delete paymentResult.draftDebitNotes;
        await Promise.all(invoices.map(async inv => {          

          switch(inv.modelName){ 
            case "credit-note":
              let credit = await this.creditNoteService.findOne(inv.modelId);
              inv.set("currency", credit.currency, { strict: false });
              break;
            case "supplierinvoice":
              let invoice = await this.invoicesService.findOne(inv.modelId);
              inv.set("soNumber", invoice.soNumber, { strict: false });
              inv.set("currency", invoice.currency, { strict: false });              
              break;
            case "customer-deposit":
              let deposit = await this.paymentDepositService.findOne(inv.modelId);
              inv.set("currency", deposit.currency, { strict: false});
              break;
          }
        }));
        await Promise.all(combinedDebit.map(async cred => {
          switch(cred.modelName){
            case "invoice":
              let invoice = await this.custInvoiceService.findOne(cred.modelId);
              cred.set("currency", invoice.currency, { strict: false });
              break;
            case "debit-note":
              let debit = await this.debitNoteService.findOne(cred.modelId);
              cred.set("currency", debit.currency, { strict: false});
              break;
            case "supplier-deposit":
              let deposit = await this.paymentDepositService.findOne(cred.modelId);
              cred.set("currency", deposit.currency, { strict: false});
              break;
            
          }          
        }));
        


    } else {
        let allReconciles = await this.reconcileService.getPaymentReconciles(paymentResult._id);

        await Promise.all(allReconciles.map(async inv => {
          switch(inv.modelName){
            case "supplierinvoice":
              let invoice = await this.invoicesService.findOne(inv.modelId);
              inv.set("currency", invoice.currency, { strict: false });
              if(paymentResult.currencyRate) {
                let latestRate = 1;
                if(invoice.currency){
                  var invoiceAny = <any>invoice.currency;
                  latestRate = invoiceAny.latestRate;
                }
                inv.allocation = Math.round(inv.allocation * paymentResult.currencyRate / latestRate *100)/100;
              }
              invoices.push(inv);
              break;
            case "credit-note":
              let cred = await this.creditNoteService.findOne(inv.modelId);
              inv.set("currency", cred.currency, { strict: false });
              if(paymentResult.currencyRate) {
                let latestRate = 1;
                if(cred.currency){
                  var invoiceAny = <any>cred.currency;
                  latestRate = invoiceAny.latestRate;
                }
                inv.allocation = Math.round(inv.allocation * paymentResult.currencyRate / latestRate *100)/100;
              }
              invoices.push(inv);
              break;
            case "customer-deposit":
              let deposit = await this.paymentDepositService.findOne(inv.modelId);
              inv.set("currency", deposit.currency, { strict: false });
              if(paymentResult.currencyRate) {
                let latestRate = 1;
                if(deposit.currency){
                  var invoiceAny = <any>deposit.currency;
                  latestRate = invoiceAny.latestRate;
                }
                inv.allocation = Math.round(inv.allocation * paymentResult.currencyRate / latestRate *100)/100;
              }
              invoices.push(inv);
              break;
            case "debit-note":
              let deb = await this.debitNoteService.findOne(inv.modelId);
              inv.set("currency", deb.currency, { strict: false });
              if(paymentResult.currencyRate) {
                let latestRate = 1;
                if(deb.currency){
                  var invoiceAny = <any>deb.currency;
                  latestRate = invoiceAny.latestRate;
                }
                inv.allocation = Math.round(inv.allocation * paymentResult.currencyRate / latestRate *100)/100;
              }
              combinedDebit.push(inv);
              break;
            case "invoice":
              let cinv = await this.custInvoiceService.findOne(inv.modelId);
              inv.set("currency", cinv.currency, { strict: false });
              if(paymentResult.currencyRate) {
                let latestRate = 1;
                if(cinv.currency){
                  var invoiceAny = <any>cinv.currency;
                  latestRate = invoiceAny.latestRate;
                }
                inv.allocation = Math.round(inv.allocation * paymentResult.currencyRate / latestRate *100)/100;
              }
              combinedDebit.push(inv);
              break;
            case "supplier-deposit":
              let sdeposit = await this.paymentDepositService.findOne(inv.modelId);
              inv.set("currency", sdeposit.currency, { strict: false });
              if(paymentResult.currencyRate) {
                let latestRate = 1;
                if(sdeposit.currency){
                  var invoiceAny = <any>sdeposit.currency;
                  latestRate = invoiceAny.latestRate;
                }
                inv.allocation = Math.round(inv.allocation * paymentResult.currencyRate / latestRate *100)/100;
              }
              combinedDebit.push(inv);
              break;              
          }

        }));

        
        
        
    }
    const data = {
      payment: paymentResult,
      invoices: invoices,
      debitNotes: combinedDebit
    };
    

    return data;
  }

  async updatePayment(id: string, updateSupplierPaymentDto: UpdateSupplierPaymentDto): Promise<any> {
    let invoices = updateSupplierPaymentDto.invoices;
    let debitNotes = updateSupplierPaymentDto.debitNotes;
    let totalDebitAllocation = 0;
    let data = updateSupplierPaymentDto;
    delete data.invoices;
    delete data.debitNotes;    

    if (data.status === 'confirmed') {
      const settingsFound = await this.sequenceSettingsService.FindSequenceByModelName(
          'SupplierPayment'
      );
      if (!settingsFound) {
        throw new InternalServerErrorException('Model name does not exist!');
      }

      

      let totalAllocation = 0;
      invoices.forEach(inv => {
        totalAllocation += parseFloat(inv.allocation);
      });
      totalAllocation = Math.round(totalAllocation * 100)/100;
      if(debitNotes.length > 0){
        debitNotes.forEach(cred => {
          totalDebitAllocation += parseFloat(cred.allocation);
        });
        totalDebitAllocation = Math.round(totalDebitAllocation *100)/100
      }
      let totalPaid = Math.round((data.total + totalDebitAllocation) *100)/100;
      if(totalPaid != totalAllocation){
        let totalWriteoff = data.expenseAmount ? parseFloat(data.expenseAmount) : 0;
        if(data.currencyLossAmount){
          totalWriteoff += parseFloat(data.currencyLossAmount);
        }

        totalWriteoff = Math.round(totalWriteoff * 100)/100; 

        if(Math.round((totalPaid - totalWriteoff) * 1000) != Math.round(totalAllocation * 1000)){
          throw new BadRequestException("Total and Total allocated do not tally. Expense amount must be added.");
        }
      }

      // Generate pattern
      if(!updateSupplierPaymentDto.paymentNo){
        const newSequenceValue = this.sequenceSettingsService.sequenceSettingEx(
          settingsFound
      );
      updateSupplierPaymentDto.paymentNo = newSequenceValue;
      await this.sequenceSettingsService.updateSequenceByModelName("SupplierPayment", settingsFound);
      }
      

      let currencyRate = 1;
      if(updateSupplierPaymentDto.paymentMethod){
        let paymentMethod = await this.paymentMethodService.findOne(updateSupplierPaymentDto.paymentMethod);
        if(paymentMethod.currency){
          currencyRate = paymentMethod.currency.latestRate;
        }
        
      }
      else if(updateSupplierPaymentDto.shortTermPaymentId){
        let shortTerm = await this.loanShortTermService.findOne(updateSupplierPaymentDto.shortTermPaymentId);
        let shortcurrencyRate = <any>shortTerm.currency;
        if(shortcurrencyRate){
          currencyRate = shortcurrencyRate.latestRate;
        }        
      }

      let paymentReconcile = {
        credit: data.total,
        debit: data.total,
        modelName: 'supplierpayment',
        modelId: id,
        invoiceNumber: updateSupplierPaymentDto.paymentNo,
        custId: updateSupplierPaymentDto.suppId,
        reconciled: false,
        reconcileId: undefined,
        allocation: 0,
        id: undefined
      };
      
      let pR = await this.reconcileService.createNewReconcile(paymentReconcile);

      invoices.forEach(async reconcile => {
        delete reconcile._id;
        let allocation = reconcile.allocation;
        //need to convert allocated amount back to original currency
        if(reconcile.currency && reconcile.currency.latestRate != currencyRate){
          allocation = allocation * reconcile.currency.latestRate / currencyRate;
          allocation = Math.round(allocation * 100) / 100;
        }
        await this.reconcileService.updateCredit({
          ...reconcile,
          allocation: allocation,
          reconcileId: pR._id,
        });

        if (allocation != 0) {
          console.log(reconcile);
          await this.reconcileService.deleteOriginalInvoices({
            modelId: reconcile.modelId,
            custId: reconcile.custId,
          });
        }

        //invoice status update
        await this.updateInvoiceStatus(reconcile.modelId);
      });

      debitNotes.map(async credit => {
        delete credit._id;
        let allocation = credit.allocation;        
        //need to convert allocated amount back to original currency
        if(credit.currency && credit.currency.latestRate != currencyRate){
          allocation = allocation * credit.currency.latestRate / currencyRate;
          allocation = Math.round(allocation * 100) / 100;
        }
        await this.reconcileService.updateReconcile({
          ...credit,
          allocation: allocation,
          reconcileId: pR._id,
        });

        if (credit.allocation != 0) {
          console.log(credit);
          await this.reconcileService.deleteOriginalInvoices({                                                  //name is wrong... just think original Credit note delete
            modelId: credit.modelId,
            custId: credit.custId,
          });
        }

        //invoice status update
        
        await this.updateInvoiceStatus(credit.modelId);
        
        
      });

      
      
      data.paymentNo = updateSupplierPaymentDto.paymentNo;
      data.status = InvoiceStatusEnum.CLOSED;
      data.draftInvoices = undefined;
      data.draftDebitNotes = undefined;
      data.currencyRate = currencyRate;

     const updated= await this.paymentModel.findByIdAndUpdate(
        id,
        {paymentDate:data.paymentDate,
          new:true       
        }
      );
      //this.createJournalEntry(updated,invoices,debitNotes)
    }
    else if(data.status === 'draft') {
        data.draftInvoices = invoices;
        data.draftDebitNotes = debitNotes;
    }

    const updatedPayment = await this.paymentModel.findByIdAndUpdate(
        id,
        data,
        {new: true}
    ).exec();

    if (data.status === 'closed') {
      if(updatedPayment.shortTermPaymentId){
        this.loanShortTermService.setActive(updatedPayment.shortTermPaymentId, false);
      }

      this.createJournalEntry(updatedPayment, invoices, debitNotes);
  }

    const result = await this.getOnePayment(id);
    return result;
  }

  async deleteOnePayment(id: string): Promise<any> {
    const payment = await this.paymentModel.findOne({_id: id});
    await this.reconcileService.removeReconcileByCust(payment.suppId);
    return await this.paymentModel.findByIdAndRemove({
      _id: id,
    });
  }

  async updateInvoiceStatus(id: string): Promise<any> {
      const reconcileResults = await this.reconcileService.findReconciles(id);
      //must checek if have any unreconciled
      let fullyReconciled = true;
      let partial = false;
      let reconcileModel = "";
      reconcileResults.forEach(reconcile => {
        reconcileModel = reconcile.modelName;
        if(!reconcile.reconciled && !reconcile.reconcileId){
          fullyReconciled = false;
          if(reconcile.credit > 0 &&  reconcile.debit > 0 && reconcile.credit != reconcile.debit ){
            partial = true;
          }
        }
      });

      switch(reconcileModel){
        case "supplierinvoice":
          if (fullyReconciled) {          
            this.invoicesService.updateStatus(id, InvoiceStatusEnum.PAID);
          }       
          else  {
            
            if(partial){
              this.invoicesService.updateStatus(id, InvoiceStatusEnum.PARTIAL);
            }                      
          }
          break;
        case "debit-note":
          if (fullyReconciled) {          
            this.debitNoteService.updateStatus(id, InvoiceStatusEnum.CLOSED);
          }       
          else  {
            
            if(partial){
              this.debitNoteService.updateStatus(id, InvoiceStatusEnum.PARTIAL);
            }                      
          }
          break;
        case "supplier-deposit":
          if (fullyReconciled) {          
            this.paymentDepositService.updateStatus(id, InvoiceStatusEnum.CLOSED);
          }       
          else  {
            
            if(partial){
              this.paymentDepositService.updateStatus(id, InvoiceStatusEnum.PARTIAL);
            }                      
          }
          break;
        case "invoice":
          if (fullyReconciled) {          
            this.custInvoiceService.updateStatus(id, InvoiceStatusEnum.PAID);
          }       
          else  {
            
            if(partial){
              this.custInvoiceService.updateStatus(id, InvoiceStatusEnum.PARTIAL);
            }                      
          }
          break;
        case "credit-note":
          if (fullyReconciled) {          
            this.creditNoteService.updateStatus(id, InvoiceStatusEnum.CLOSED);
          }       
          else  {
            
            if(partial){
              this.creditNoteService.updateStatus(id, InvoiceStatusEnum.PARTIAL);
            }                      
          }
          break;

        case "customer-deposit":
          if (fullyReconciled) {          
            this.paymentDepositService.updateStatus(id, InvoiceStatusEnum.CLOSED);
          }       
          else  {
            
            if(partial){
              this.paymentDepositService.updateStatus(id, InvoiceStatusEnum.PARTIAL);
            }                      
          }
          break;
        
      }
  }
  
  async createJournalEntry(updatedPayment: any, invoices: any, debitNotes: any) {
    let journalItems = [];
    let totalPayments = 0;
    let totalPaymentsConverted = 0;
    let totalPaid = updatedPayment.total;
    let totalDebit = 0;
    let totalDebitConverted = totalDebit;
    let totalExpense = updatedPayment.expenseAmount ? updatedPayment.expenseAmount : 0;
    let totalCurrency = updatedPayment.currencyLossAmount ? updatedPayment.currencyLossAmount : 0;
    let totalExpenseConverted = totalExpense;
    let totalCurrencyConverted = totalCurrency;    
 
    let paymentMethodResult;
    if(updatedPayment.paymentMethod){
      paymentMethodResult = await this.paymentMethodService.findOne(updatedPayment.paymentMethod);    
    }
    else {
      paymentMethodResult = await this.loanShortTermService.findOne(updatedPayment.shortTermPaymentId);
    } 
    
    let paymentCurrency = 1;
    if(paymentMethodResult.currency){
      paymentCurrency = paymentMethodResult.currency.latestRate;
    }
    invoices.map((invoice) => {      
      
      if(invoice.reconciled){
        if(invoice.currency && invoice.currency.latestRate != paymentCurrency){
          let convertedBalance = invoice.balance / invoice.currency.latestRate * paymentCurrency;
          totalPayments += convertedBalance; 
        }
        else {
          totalPayments += invoice.balance; //balance is not converted to payment currency
        }        
      }
      else {
        totalPayments += invoice.allocation 
      }
      
    });
    debitNotes.map((debit) => { 
      if(debit.reconciled){
        if(debit.currency && debit.currency.latestRate != paymentCurrency){
          let convertedBalance = debit.balance / debit.currency.latestRate * paymentCurrency;
          totalDebit += convertedBalance; 
        }
        else {
        totalDebit += debit.balance; //balance is not converted to payment currency
        }
      }
      else {
        totalDebit += debit.allocation 
      }
    });
    totalPaymentsConverted = totalPayments;
    //const invoiceAccount = await this.invoicesService.findOne(invoices[0].modelId);
    //const invoiceAccountItem = await this.accountItemService.findOne(invoiceAccount.account);

    
    if(paymentMethodResult.currency){      
      totalPaid =  totalPaid / paymentMethodResult.currency.latestRate;
      if(totalExpense !== 0){
        totalExpenseConverted = totalExpense / paymentMethodResult.currency.latestRate;
      }
      if(totalCurrency !== 0){
        totalCurrencyConverted = totalCurrency / paymentMethodResult.currency.latestRate;
      }
      if(totalDebit !=- 0){
        totalDebitConverted = totalDebit / paymentMethodResult.currency.latestRate;
      }
      totalPaymentsConverted = totalPayments / paymentMethodResult.currency.latestRate;      
    }

    let mainOne = {
      reference: updatedPayment.paymentNo,
      name: paymentMethodResult.name,
      partner: updatedPayment.suppName,
      partner_id: updatedPayment.suppId,
      account: updatedPayment.paymentMethod ?  paymentMethodResult.account._id : paymentMethodResult.credit_account,
      dueDate: updatedPayment.paymentDate ? updatedPayment.paymentDate : '',
      debit:  0,
      credit: totalPaid,
      amountCurrency: updatedPayment.total,
      currency: paymentMethodResult.currency ? paymentMethodResult.currency._id : '',
      taxAmount: 0,
      reconcile: '',
      partialReconcile: ''
    };
    journalItems.push(mainOne);
    
    for(let i=0; i < invoices.length; i++){
      let invoiceAccount = "";
      let invoice = invoices[i];
      let invoiceAmount = 0; 
      let invoiceConverted = 0;
      let invoiceCurrency = "";
      if(invoice.reconciled){
        if(invoice.currency && invoice.currency.latestRate){
          invoiceConverted = invoice.balance / invoice.currency.latestRate;
          
        }
        else {
          invoiceConverted = invoice.balance;
        }
        invoiceAmount = invoice.balance;
      }
      else {
        //allocation is in payment currency. need to convert to local currency
          
        if(invoice.currency){
          invoiceConverted = invoice.allocation / paymentCurrency * invoice.currency.latestRate;
        }
        else {
          invoiceConverted = invoice.allocation;
        }
        
        invoiceConverted = invoice.allocation / paymentCurrency;
        if(invoice.currency){
          invoiceAmount = invoice.allocation / paymentCurrency * invoice.currency.latestRate; 
        }
        else {
          invoiceAmount = invoice.allocation;
        }   
      }
      if(invoice.currency){
        invoiceCurrency = invoice.currency._id;
      }
      if(invoiceAmount != 0){
        switch(invoice.modelName){
          case "supplierinvoice":
            let inv = await this.invoicesService.findOne(invoice.modelId);
            invoiceAccount = inv.account;
            break;
          case "credit-note":
            let dnote = await this.creditNoteService.findOne(invoice.modelId);
            invoiceAccount = dnote.account;
            break;
          case "customer-deposit":
            let sdep = await this.paymentDepositService.findOne(invoice.modelId);
            invoiceAccount = sdep.account;
            break;        
        }
        let mainOne = {
          reference: updatedPayment.paymentNo,
          name: updatedPayment.paymentNo,
          partner: updatedPayment.suppName,
          partner_id: updatedPayment.suppId,
          account: invoiceAccount,
          dueDate: updatedPayment.paymentDate ? updatedPayment.paymentDate : '',
          debit: invoiceConverted,
          credit: 0,
          amountCurrency: invoiceAmount,
          currency: invoiceCurrency,
          taxAmount: 0,
          reconcile: '',
          partialReconcile: ''
            };
        journalItems.push(mainOne);
      }

    }    
    
    if(totalDebit != 0){
      for(let i=0; i < debitNotes.length; i++){
        let creditAccount = "";
        let debit = debitNotes[i];
        let debitAmount = 0;
        let debitConverted = 0;
        if(debit.reconciled){
          if(debit.currency && debit.currency.latestRate){
            debitConverted = debit.balance / debit.currency.latestRate;
           
          }
          else {
            debitConverted = debit.balance; //balance is not converted to payment currency
          }
          debitAmount = debit.balance;
        }
        else {
          //allocation is in payment currency. need to convert to local currency
          
          debitConverted = debit.allocation / paymentCurrency;
          if(debit.currency){
            debitAmount = debit.allocation / paymentCurrency * debit.currency.latestRate; 
          }
          else {
            debitAmount = debit.allocation;
          }          
        }
        switch(debit.modelName){
          case "debit-note":
            let cred = await this.debitNoteService.findOne(debit.modelId);
            creditAccount = cred.salesOrderItems.length > 0 ? cred.salesOrderItems[0].account : "" 
            break;
          case "supplier-deposit":
            let cdep = await this.paymentDepositService.findOne(debit.modelId);
            creditAccount = cdep.salesOrderItems.length > 0 ? cdep.salesOrderItems[0].account : "" 
            break;
          case "invoice":
            let suppinv = await this.custInvoiceService.findOne(debit.modelId);
            creditAccount = suppinv.salesOrderItems.length > 0 ? suppinv.salesOrderItems[0].account : "" 
            break;
        }

        let anotherOne = {
          reference: updatedPayment.paymentNo,
          name: updatedPayment.paymentNo,
          partner: updatedPayment.suppName,
          partner_id: updatedPayment.suppId,
          account: creditAccount,
          dueDate: updatedPayment.paymentDate ? updatedPayment.paymentDate : '',
          debit: 0,
          credit: debitConverted,
          amountCurrency: debitAmount,
          currency: debit.currency ? debit.currency._id : '',
          taxAmount: 0,
          reconcile: '',
          partialReconcile: ''
        };
        journalItems.push(anotherOne);
      }     
         
      
    }

    if(totalExpense != 0){
      journalItems.push(
        {
          reference: updatedPayment.paymentNo,
          name: paymentMethodResult.name,
          partner: updatedPayment.suppName,
          partner_id: updatedPayment.suppId,
          account: updatedPayment.expenseAccount,
          dueDate: updatedPayment.paymentDate ? updatedPayment.paymentDate : '',
          debit: totalExpenseConverted > 0 ? totalExpenseConverted: 0 ,
          credit: totalExpenseConverted < 0 ? totalExpenseConverted * -1 : 0,
          amountCurrency: totalExpense,
          currency: paymentMethodResult.currency ? paymentMethodResult.currency._id : '',
          taxAmount: 0,
          reconcile: '',
          partialReconcile: ''
        }
      )
    }
    if(totalCurrency != 0){
      journalItems.push(
        {
          reference: updatedPayment.paymentNo,
          name: paymentMethodResult.name,
          partner: updatedPayment.suppName,
          partner_id: updatedPayment.suppId,
          account: updatedPayment.currencyAccount,
          dueDate: updatedPayment.paymentDate ? updatedPayment.paymentDate : '',
          debit: totalCurrencyConverted > 0 ? totalCurrencyConverted : 0 ,
          credit: totalCurrencyConverted < 0 ? totalCurrencyConverted * -1 : 0,
          amountCurrency: totalCurrency,
          currency: paymentMethodResult.currency ? paymentMethodResult.currency._id : '',
          taxAmount: 0,
          reconcile: '',
          partialReconcile: ''
        }
      )
    }
    let totalCreditAmount = totalPaid + totalDebitConverted;
    let totalDebitAmount = totalPaymentsConverted;
    if(totalExpenseConverted > 0){
      totalDebitAmount += totalExpenseConverted;
    }
    else {
      totalCreditAmount += totalExpenseConverted * -1;
    }
    if(totalCurrencyConverted > 0){
      totalDebitAmount += totalCurrencyConverted;
    }
    else {
      totalCreditAmount += totalCurrencyConverted * -1;
    }

    const journalData = {
      status: 'draft',
      journalEntryNum: '',
      remarks: updatedPayment.remarks,
      reference: updatedPayment.paymentNo,
      period: '',
      toReview: false,
      totalCredit: totalCreditAmount,
      totalDebit: totalDebitAmount,
      journalValue: paymentMethodResult.journal ? paymentMethodResult.journal._id : "",
      journalItems: journalItems ? journalItems : [],
      entryDate: updatedPayment.paymentDate,
      modelId:updatedPayment._id,
      modelName:'SupplierPayment'
    };
    console.log(updatedPayment);
    const findOneJournal=await this.journalEntryService.findOneWithModelId(updatedPayment._id)
    if(!findOneJournal){
      console.log("creating new journal");
      console.log(journalData);
    await this.journalEntryService.create(journalData);
  }
  else{
    console.log("found", findOneJournal);
    findOneJournal.entryDate=updatedPayment.paymentDate
    await this.journalEntryService.update(findOneJournal._id,findOneJournal)
  }
}
}
