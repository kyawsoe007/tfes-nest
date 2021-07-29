import {
  ForbiddenException, forwardRef,
  HttpException, Inject,
  Injectable,
  InternalServerErrorException,
  BadRequestException
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose'; // Added new Line

import { Model } from 'mongoose'; // Added new line
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { InvoicesService } from 'src/invoices/invoices.service';
import { SupplierInvoiceService } from 'src/supplier-invoice/supplier-invoice.service';
import { SequenceSettingsService } from 'src/sequence-settings/sequence-settings.service';
import { ReconcileService } from 'src/reconcile/reconcile.service';
import { CreditNoteService } from 'src/credit-note/credit-note.service';
import { DebitNoteService } from 'src/debit-note/debit-note.service';
import { JournalEntryService } from 'src/journal-entry/journal-entry.service';
import { PaymentMethodService } from 'src/payment-method/payment-method.service';
import { AccountItemService } from 'src/account-item/account-item.service';
import { PaymentDepositService } from 'src/payment-deposits/payment-deposit.service';
import { Payment } from "./interfaces/payment.interface";
import { FilterDto } from "../shared/filter.dto";
import { InvoiceStatusEnum } from 'src/invoices/dto/create-invoice.dto';

@Injectable()
// List of methods of queries to access to database with Respository
export class PaymentService {
  // added constructor
  constructor(
    @InjectModel('Payment')
    private readonly paymentModel: Model<Payment>,
    private readonly sequenceSettingsService: SequenceSettingsService,
    @Inject(forwardRef(() => InvoicesService))
    private readonly invoicesService: InvoicesService,
    @Inject(forwardRef(() => SupplierInvoiceService))
    private readonly supplierInvoiceService: SupplierInvoiceService,
    @Inject(forwardRef(() => ReconcileService))
    private readonly reconcileService: ReconcileService,
    private readonly creditNoteService: CreditNoteService,
    private readonly debitNoteService: DebitNoteService,
    private readonly journalEntryService: JournalEntryService,
    private readonly paymentMethodService: PaymentMethodService,
    private readonly accountItemService: AccountItemService,
    private readonly paymentDepositService: PaymentDepositService
  ) { }

  // Create New reconcile
  async createNewPayment(
    createPaymentDto: CreatePaymentDto
  ): Promise<any> {
    let data = createPaymentDto;
    let invoices = createPaymentDto.invoices;
    let creditNotes = createPaymentDto.creditNotes;
    delete data.invoices;
    delete data.creditNotes;
    data.draftInvoices = invoices;
    data.draftCreditNotes = creditNotes;

    const newPayment = new this.paymentModel(data);
    let createdPayment = await newPayment.save();
    let paymentReturnValue = createdPayment;
    delete paymentReturnValue.draftInvoices;
    delete paymentReturnValue.draftCreditNotes;
    await Promise.all(createdPayment.draftInvoices.map(async inv => {
      switch (inv.modelName) {
        case "invoice":
          let invoice = await this.invoicesService.findOne(inv.modelId);
          inv.set("currency", invoice.currency, { strict: false });
          break;
        case "debit-note":
          let debit = await this.debitNoteService.findOne(inv.modelId);
          inv.set("currency", debit.currency, { strict: false });
          break;
        case "supplier-deposit":
          let deposit = await this.paymentDepositService.findOne(inv.modelId);
          inv.set("currency", deposit.currency, { strict: false });
          break;

      }
    }));
    await Promise.all(createdPayment.draftCreditNotes.map(async cred => {
      switch (cred.modelName) {
        case "credit-note":
          let credit = await this.creditNoteService.findOne(cred.modelId);
          cred.set("currency", credit.currency, { strict: false });
          break;
        case "supplierinvoice":
          let suppinv = await this.supplierInvoiceService.findOne(cred.modelId);
          cred.set("currency", suppinv.currency, { strict: false });
          break;
        case "customer-deposit":
          let deposit = await this.paymentDepositService.findOne(cred.modelId);
          cred.set("currency", deposit.currency, { strict: false });
          break;
      }
    }));

    const returnResult = {
      payment: paymentReturnValue,
      invoices: createdPayment.draftInvoices,
      creditNotes: createdPayment.draftCreditNotes
    };
    return returnResult;
  }

  async getfilters(query: FilterDto): Promise<any> {
    const limit = query.limit ? query.limit : 0;
    const skip = query.skip ? query.skip : 0;
    const filter = query.filter ? query.filter : [];
    const searchText = query.searchText ? query.searchText : '';
    const orderBy = query.orderBy && Object.keys(query.orderBy).length > 0
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
          { custName: searchPattern }, // Customer name
          { paymentNo: searchPattern }, //payment No
          { paymentRef: searchPattern }, //payment ref
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
    let creditNotes = [];
    let combined = [];
    let paymentResult = await this.paymentModel.findOne({ _id: id });

    if (paymentResult.status === 'draft') {
      invoices = paymentResult.draftInvoices;
      combined = paymentResult.draftCreditNotes;
      delete paymentResult.draftInvoices;
      delete paymentResult.draftCreditNotes;
      await Promise.all(invoices.map(async inv => {
        switch (inv.modelName) {
          case "invoice":
            let invoice = await this.invoicesService.findOne(inv.modelId);
            inv.set("currency", invoice.currency, { strict: false });
            break;
          case "debit-note":
            let debit = await this.debitNoteService.findOne(inv.modelId);
            inv.set("currency", debit.currency, { strict: false });
            break;
          case "supplier-deposit":
            let deposit = await this.paymentDepositService.findOne(inv.modelId);
            inv.set("currency", deposit.currency, { strict: false });
            break;

        }
      }));
      await Promise.all(combined.map(async cred => {
        switch (cred.modelName) {
          case "credit-note":
            let credit = await this.creditNoteService.findOne(cred.modelId);
            cred.set("currency", credit.currency, { strict: false });
            break;
          case "supplierinvoice":
            let suppinv = await this.supplierInvoiceService.findOne(cred.modelId);
            cred.set("currency", suppinv.currency, { strict: false });
            break;
          case "customer-deposit":
            let deposit = await this.paymentDepositService.findOne(cred.modelId);
            cred.set("currency", deposit.currency, { strict: false });
            break;
        }
      }));
    } else {
      //get own reconcile first
      let allReconciles = await this.reconcileService.getPaymentReconciles(paymentResult._id);
      //creditNotes = await this.reconcileService.getPaymentReconciles(paymentResult._id, 'credit-note');
      //let deposits = await this.reconcileService.getPaymentReconciles(paymentResult._id, 'customer-deposit');
      //change allocation to payment currency


      await Promise.all(allReconciles.map(async inv => {
        switch (inv.modelName) {
          case "invoice":
            let invoice = await this.invoicesService.findOne(inv.modelId);
            inv.set("currency", invoice.currency, { strict: false });
            if (paymentResult.currencyRate) {
              let latestRate = 1;
              if (invoice.currency) {
                var invoiceAny = <any>invoice.currency;
                latestRate = invoiceAny.latestRate;
              }
              inv.allocation = Math.round(inv.allocation * paymentResult.currencyRate / latestRate * 100) / 100;
            }
            invoices.push(inv);
            break;
          case "debit-note":
            let deb = await this.debitNoteService.findOne(inv.modelId);
            inv.set("currency", deb.currency, { strict: false });
            if (paymentResult.currencyRate) {
              let latestRate = 1;
              if (deb.currency) {
                var invoiceAny = <any>deb.currency;
                latestRate = invoiceAny.latestRate;
              }
              inv.allocation = Math.round(inv.allocation * paymentResult.currencyRate / latestRate * 100) / 100;
            }
            invoices.push(inv);
            break;
          case "supplier-deposit":
            let sdeposit = await this.paymentDepositService.findOne(inv.modelId);
            inv.set("currency", sdeposit.currency, { strict: false });
            if (paymentResult.currencyRate) {
              let latestRate = 1;
              if (sdeposit.currency) {
                var invoiceAny = <any>sdeposit.currency;
                latestRate = invoiceAny.latestRate;
              }
              inv.allocation = Math.round(inv.allocation * paymentResult.currencyRate / latestRate * 100) / 100;
            }
            invoices.push(inv);
            break;
          case "credit-note":
            let cred = await this.creditNoteService.findOne(inv.modelId);
            inv.set("currency", cred.currency, { strict: false });
            if (paymentResult.currencyRate) {
              let latestRate = 1;
              if (cred.currency) {
                var invoiceAny = <any>cred.currency;
                latestRate = invoiceAny.latestRate;
              }
              inv.allocation = Math.round(inv.allocation * paymentResult.currencyRate / latestRate * 100) / 100;
            }
            creditNotes.push(inv);
            break;
          case "supplierinvoice":
            let supps = await this.creditNoteService.findOne(inv.modelId);
            inv.set("currency", supps.currency, { strict: false });
            if (paymentResult.currencyRate) {
              let latestRate = 1;
              if (supps.currency) {
                var invoiceAny = <any>supps.currency;
                latestRate = invoiceAny.latestRate;
              }
              inv.allocation = Math.round(inv.allocation * paymentResult.currencyRate / latestRate * 100) / 100;
            }
            creditNotes.push(inv);
            break;
          case "customer-deposit":
            let cdeposit = await this.paymentDepositService.findOne(inv.modelId);
            inv.set("currency", cdeposit.currency, { strict: false });
            if (paymentResult.currencyRate) {
              let latestRate = 1;
              if (cdeposit.currency) {
                var invoiceAny = <any>cdeposit.currency;
                latestRate = invoiceAny.latestRate;
              }
              inv.allocation = Math.round(inv.allocation * paymentResult.currencyRate / latestRate * 100) / 100;
            }
            creditNotes.push(inv);
            break;
        }

      }));

    }

    const data = {
      payment: paymentResult,
      invoices: invoices,
      creditNotes: creditNotes
    };

    return data;
  }

  async updatePayment(id: string, updatePaymentDto: UpdatePaymentDto): Promise<any> {
    let invoices = updatePaymentDto.invoices;
    let creditNotes = updatePaymentDto.creditNotes;
    let totalCreditAllocation = 0;
    let data = updatePaymentDto;
    delete data.invoices;
    delete data.creditNotes;

    if (data.status === 'confirmed') {
      const settingsFound = await this.sequenceSettingsService.FindSequenceByModelName(
        'Payment'
      );
      if (!settingsFound) {
        throw new InternalServerErrorException('Model name does not exist!');
      }

      //check that invoices amount and expenses all match up

      let totalAllocation = 0;
      invoices.forEach(inv => {
        totalAllocation += parseFloat(inv.allocation);
      });

      totalAllocation = Math.round(totalAllocation * 100) / 100;
      if (creditNotes.length > 0) {
        creditNotes.forEach(cred => {
          totalCreditAllocation += parseFloat(cred.allocation);
        });
        totalCreditAllocation = Math.round(totalCreditAllocation * 100) / 100
      }
      let totalPaid = Math.round((data.total + totalCreditAllocation) * 100) / 100;
      if (totalPaid != totalAllocation) {

        let totalWriteoff = data.expenseAmount ? parseFloat(data.expenseAmount) : 0;
        if (data.currencyLossAmount) {
          totalWriteoff += parseFloat(data.currencyLossAmount);
        }
        totalWriteoff = Math.round(totalWriteoff * 100) / 100;

        if (Math.round((totalPaid + totalWriteoff) * 1000) != Math.round(totalAllocation * 1000)) {
          
          throw new BadRequestException("Total and Total allocated do not tally. Expense amount must be added.");
        }
      }

      // Generate pattern
      if(!updatePaymentDto.paymentNo){
        const newSequenceValue = this.sequenceSettingsService.sequenceSettingEx(
          settingsFound
        );
        updatePaymentDto.paymentNo = newSequenceValue;
        await this.sequenceSettingsService.updateSequenceByModelName("Payment", settingsFound);
      }
      
      let currencyRate = 1;
      if (updatePaymentDto.paymentMethod) {
        let paymentMethod = await this.paymentMethodService.findOne(updatePaymentDto.paymentMethod);

        currencyRate = paymentMethod.currency.latestRate;
      }


      let paymentReconcile = {
        credit: data.total,
        debit: data.total,
        modelName: 'payment',
        modelId: id,
        invoiceNumber: updatePaymentDto.paymentNo,
        custId: updatePaymentDto.custId,
        reconciled: true,
        reconcileId: undefined,
        allocation: updatePaymentDto.total,
        id: undefined
      };

      let pR = await this.reconcileService.createNewReconcile(paymentReconcile);

      invoices.map(async invoice => {
        delete invoice._id;
        let allocation = invoice.allocation;
        //need to convert allocated amount back to original currency
        if (invoice.currency && invoice.currency.latestRate != currencyRate) {
          allocation = allocation * invoice.currency.latestRate / currencyRate;
          allocation = Math.round(allocation * 100) / 100;
        }
        await this.reconcileService.updateReconcile({
          ...invoice,
          allocation: allocation,
          reconcileId: pR._id,
        });

        if (allocation != 0) {
          await this.reconcileService.deleteOriginalInvoices({
            modelId: invoice.modelId,
            custId: invoice.custId,
          });
        }
        //console.log(reconcile.modelId)
        //invoice status update
        await this.updateInvoiceStatus(invoice.modelId);
      });

      creditNotes.map(async credit => {
        delete credit._id;
        let allocation = credit.allocation;
        //need to convert allocated amount back to original currency
        if (credit.currency && credit.currency.latestRate != currencyRate) {
          allocation = allocation * credit.currency.latestRate / currencyRate;
          allocation = Math.round(allocation * 100) / 100;
        }
        await this.reconcileService.updateCredit({
          ...credit,
          allocation: allocation,
          reconcileId: pR._id,
        });

        if (allocation != 0) {
          await this.reconcileService.deleteOriginalInvoices({                                                  //name is wrong... just think original Credit note delete
            modelId: credit.modelId,
            custId: credit.custId,
          });
        }

        //invoice status update
        await this.updateInvoiceStatus(credit.modelId);

      });



      data.paymentNo = updatePaymentDto.paymentNo;
      data.status = InvoiceStatusEnum.CLOSED;
     
      data.draftInvoices = undefined;
      data.currencyRate = currencyRate;
    } else if (data.status === 'draft') {
      data.draftInvoices = invoices;
      data.draftCreditNotes = creditNotes;
    }

    const updatedPayment = await this.paymentModel.findByIdAndUpdate(
      id,
      data,
      { new: true }
    );

    if (data.status === 'closed') {      
      this.createJournalEntry(updatedPayment, invoices, creditNotes);
    }

    const result = await this.getOnePayment(id);
    return result;
  }

  async deleteOnePayment(id: string): Promise<any> {
    const payment = await this.paymentModel.findOne({ _id: id });
    await this.reconcileService.removeReconcileByCust(payment.custId);
    return await this.paymentModel.findByIdAndRemove({
      _id: id,
    });
  }

  async updateInvoiceStatus(id: string): Promise<any> {

    //let forceReconcile = false;
    const reconcileResults = await this.reconcileService.findReconciles(id);
    let fullyReconciled = true;
    let partial = false;
    let reconcileModel = "";
    reconcileResults.forEach(reconcile => {
      console.log(reconcile);
      reconcileModel = reconcile.modelName;
      if (!reconcile.reconciled && !reconcile.reconcileId) {
        fullyReconciled = false;
        if (reconcile.credit > 0 && reconcile.debit > 0 && reconcile.credit != reconcile.debit) {
          partial = true;
        }
      }
    });
    switch (reconcileModel) {
      case "invoice":
        if (fullyReconciled) {
          this.invoicesService.updateStatus(id, InvoiceStatusEnum.PAID);
        }
        else {

          if (partial) {
            this.invoicesService.updateStatus(id, InvoiceStatusEnum.PARTIAL);
          }
        }
        break;
      case "debit-note":
        if (fullyReconciled) {
          this.debitNoteService.updateStatus(id, InvoiceStatusEnum.CLOSED);
        }
        else {

          if (partial) {
            this.debitNoteService.updateStatus(id, InvoiceStatusEnum.PARTIAL);
          }
        }
        break;
      case "supplier-deposit":
        if (fullyReconciled) {
          this.paymentDepositService.updateStatus(id, InvoiceStatusEnum.CLOSED);
        }
        else {

          if (partial) {
            this.paymentDepositService.updateStatus(id, InvoiceStatusEnum.PARTIAL);
          }
        }
        break;
      case "supplierinvoice":
        if (fullyReconciled) {
          this.supplierInvoiceService.updateStatus(id, InvoiceStatusEnum.PAID);
        }
        else {

          if (partial) {
            this.supplierInvoiceService.updateStatus(id, InvoiceStatusEnum.PARTIAL);
          }
        }
        break;
      case "credit-note":
        if (fullyReconciled) {
          this.creditNoteService.updateStatus(id, InvoiceStatusEnum.CLOSED);
        }
        else {

          if (partial) {
            this.creditNoteService.updateStatus(id, InvoiceStatusEnum.PARTIAL);
          }
        }
        break;

      case "customer-deposit":
        if (fullyReconciled) {
          this.paymentDepositService.updateStatus(id, InvoiceStatusEnum.CLOSED);
        }
        else {

          if (partial) {
            this.paymentDepositService.updateStatus(id, InvoiceStatusEnum.PARTIAL);
          }
        }
        break;

    }


  }

  /*
  async updateCreditNotesStatus(id: string): Promise<any> {
      const creditResults = await this.reconcileService.findCreditNotes(id);
      let fullyReconciled = true;
      let partial  = false;
      creditResults.map(credit => {
        if(!credit.reconciled && !credit.reconcileId){
          fullyReconciled = false;
          if(credit.debit != credit.credit){
            partial = true;
          }
        }
      });

      //const creditResult = await this.creditNoteService.findCreditNote(id);
      //creditNoteAmount = creditResult.total;

      if (fullyReconciled) {
        this.creditNoteService.updateStatus(id, InvoiceStatusEnum.CLOSED);
      } else if(partial){
        this.creditNoteService.updateStatus(id, InvoiceStatusEnum.PARTIAL);
      }
  }
  

  async updateDepositStatus(id: string): Promise<any> {
    const creditResults = await this.reconcileService.findDeposits(id);
    let fullyReconciled = true;
    let partial  = false;
    creditResults.map(credit => {
      if(!credit.reconciled && !credit.reconcileId){
        fullyReconciled = false;
        if(credit.credit != credit.debit){
          partial = true;
        }
      }
    });

    if (fullyReconciled) {
      this.paymentDepositService.updateStatus(id, InvoiceStatusEnum.CLOSED);
    } else if(partial){
      this.paymentDepositService.updateStatus(id, InvoiceStatusEnum.PARTIAL);
    }
  }
  */

  async createJournalEntry(updatedPayment: any, invoices: any, creditNotes: any) {
    let journalItems = [];
    let totalPayments = 0;

    let totalPaid = updatedPayment.total;
    let totalCredit = 0;
    let totalCreditConverted = totalCredit;
    let totalExpense = updatedPayment.expenseAmount ? updatedPayment.expenseAmount : 0;
    let totalCurrency = updatedPayment.currencyLossAmount ? updatedPayment.currencyLossAmount : 0;
    let totalExpenseConverted = totalExpense;
    let totalCurrencyConverted = totalCurrency;
    const paymentMethodResult = await this.paymentMethodService.findOne(updatedPayment.paymentMethod);
    let paymentCurrency = 1;
    if (paymentMethodResult.currency) {
      paymentCurrency = paymentMethodResult.currency.latestRate;
    }
    invoices.map((invoice) => {
      if (invoice.reconciled) {
        if (invoice.currency && invoice.currency.latestRate != paymentCurrency) {
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

    });  //allocation might not meet totalpayment
    creditNotes.map((credit) => {
      if (credit.reconciled) {
        if (credit.currency && credit.currency.latestRate != paymentCurrency) {
          let convertedBalance = credit.balance / credit.currency.latestRate * paymentCurrency;
          totalCredit += convertedBalance;
        }
        else {
          totalCredit += credit.balance; //balance is not converted to payment currency
        }
      }
      else {
        totalCredit += credit.allocation
      }

    });
    let totalPaymentsConverted = totalPayments;
    //const invoiceAccount = await this.invoicesService.findOne(invoices[0].modelId);

    //const invoiceAccountItem = await this.accountItemService.findOne(invoiceAccount.account);


    if (paymentMethodResult.currency) {
      totalPaid = totalPaid / paymentMethodResult.currency.latestRate;

      if (totalExpense !== 0) {
        totalExpenseConverted = totalExpense / paymentMethodResult.currency.latestRate;
      }
      if (totalCurrency !== 0) {
        totalCurrencyConverted = totalCurrency / paymentMethodResult.currency.latestRate;
      }
      if (totalCredit !== 0) {
        totalCreditConverted = totalCredit / paymentMethodResult.currency.latestRate;
      }
      totalPaymentsConverted = totalPayments / paymentMethodResult.currency.latestRate;
    }



    let mainOne = {
      reference: updatedPayment.paymentNo,
      name: paymentMethodResult.name,
      partner: updatedPayment.custName,
      partner_id: updatedPayment.custId,
      account: paymentMethodResult.account._id,
      dueDate: updatedPayment.paymentDate ? updatedPayment.paymentDate : '',
      debit: totalPaid,
      credit: 0,
      amountCurrency: updatedPayment.total,
      currency: paymentMethodResult.currency ? paymentMethodResult.currency._id : '',
      taxAmount: 0,
      reconcile: '',
      partialReconcile: ''
    };
    journalItems.push(mainOne);

    for (let i = 0; i < invoices.length; i++) {
      let invoiceAccount = "";
      let invoice = invoices[i];
      let invoiceAmount = 0;
      let invoiceConverted = 0;
      let invoiceCurrency = "";
      if (invoice.reconciled) {
        if (invoice.currency && invoice.currency.latestRate) {
          invoiceConverted = invoice.balance / invoice.currency.latestRate;

        }
        else {
          invoiceConverted = invoice.balance;
        }
        invoiceAmount = invoice.balance;
      }
      else {
        //allocation is in payment currency. need to convert to local currency

        if (invoice.currency) {
          invoiceConverted = invoice.allocation / paymentCurrency * invoice.currency.latestRate;
        }
        else {
          invoiceConverted = invoice.allocation;
        }

        invoiceConverted = invoice.allocation / paymentCurrency;
        if (invoice.currency) {
          invoiceAmount = invoice.allocation / paymentCurrency * invoice.currency.latestRate;
        }
        else {
          invoiceAmount = invoice.allocation;
        }
      }
      if (invoice.currency) {
        invoiceCurrency = invoice.currency._id;
      }
      //check if amount > 0
      if (invoiceAmount != 0) {
        switch (invoice.modelName) {
          case "invoice":
            let inv = await this.invoicesService.findOne(invoice.modelId);
            invoiceAccount = inv.account;
            break;
          case "debit-note":
            let dnote = await this.debitNoteService.findOne(invoice.modelId);
            invoiceAccount = dnote.account;
            break;
          case "supplier-deposit":
            let sdep = await this.paymentDepositService.findOne(invoice.modelId);
            invoiceAccount = sdep.account;
            break;
        }
        let mainOne = {
          reference: updatedPayment.paymentNo,
          name: invoice.invoiceNumber,
          partner: updatedPayment.custName,
          partner_id: updatedPayment.custId,
          account: invoiceAccount,
          dueDate: updatedPayment.paymentDate ? updatedPayment.paymentDate : '',
          debit: 0,
          credit: invoiceConverted,
          amountCurrency: invoiceAmount,
          currency: invoiceCurrency,
          taxAmount: 0,
          reconcile: '',
          partialReconcile: ''
        };
        journalItems.push(mainOne);
      }

    }

    if (totalCredit != 0) {
      for (let i = 0; i < creditNotes.length; i++) {
        let creditAccount = "";
        let credit = creditNotes[i];
        let creditAmount = 0;
        let creditConverted = 0;
        if (credit.reconciled) {
          if (credit.currency && credit.currency.latestRate) {
            creditConverted = credit.balance / credit.currency.latestRate;

          }
          else {
            creditConverted = credit.balance; //balance is not converted to payment currency
          }
          creditAmount = credit.balance;
        }
        else {
          //allocation is in payment currency. need to convert to local currency

          creditConverted = credit.allocation / paymentCurrency;
          if (credit.currency) {
            creditAmount = credit.allocation / paymentCurrency * credit.currency.latestRate;
          }
          else {
            creditAmount = credit.allocation;
          }
        }
        switch (credit.modelName) {
          case "credit-note":
            let cred = await this.creditNoteService.findOne(credit.modelId);
            creditAccount = cred.account
            break;
          case "customer-deposit":
            let cdep = await this.paymentDepositService.findOne(credit.modelId);
            creditAccount = cdep.account;
            break;
          case "supplier-invoice":
            let suppinv = await this.supplierInvoiceService.findOne(credit.modelId);
            creditAccount = suppinv.account;
            break;
        }
        let anotherOne = {
          reference: updatedPayment.paymentNo,
          name: credit.invoiceNumber,
          partner: updatedPayment.custName,
          partner_id: updatedPayment.custId,
          account: creditAccount,
          dueDate: updatedPayment.paymentDate ? updatedPayment.paymentDate : '',
          debit: creditConverted,
          credit: 0,
          amountCurrency: creditAmount,
          currency: credit.currency ? credit.currency._id : '',
          taxAmount: 0,
          reconcile: '',
          partialReconcile: ''
        };
        journalItems.push(anotherOne);
      }

    }

    if (totalExpense != 0) {
      journalItems.push(
        {
          reference: updatedPayment.paymentNo,
          name: paymentMethodResult.name,
          partner: updatedPayment.custName,
          partner_id: updatedPayment.custId,
          account: updatedPayment.expenseAccount,
          dueDate: updatedPayment.paymentDate ? updatedPayment.paymentDate : '',
          debit: totalExpenseConverted > 0 ? totalExpenseConverted : 0,
          credit: totalExpenseConverted < 0 ? totalExpenseConverted * -1 : 0,
          amountCurrency: totalExpense,
          currency: paymentMethodResult.currency ? paymentMethodResult.currency._id : '',
          taxAmount: 0,
          reconcile: '',
          partialReconcile: ''
        }
      )
    }
    if (totalCurrency != 0) {
      journalItems.push(
        {
          reference: updatedPayment.paymentNo,
          name: paymentMethodResult.name,
          partner: updatedPayment.custName,
          partner_id: updatedPayment.custId,
          account: updatedPayment.currencyAccount,
          dueDate: updatedPayment.paymentDate ? updatedPayment.paymentDate : '',
          debit: totalCurrencyConverted > 0 ? totalCurrencyConverted : 0,
          credit: totalCurrencyConverted < 0 ? totalCurrencyConverted * -1 : 0,
          amountCurrency: totalCurrency,
          currency: paymentMethodResult.currency ? paymentMethodResult.currency._id : '',
          taxAmount: 0,
          reconcile: '',
          partialReconcile: ''
        }
      )
    }

    let totalDebitAmount = totalPaid + totalCreditConverted;
    let totalCreditAmount = totalPaymentsConverted;
    if (totalExpenseConverted > 0) {
      totalDebitAmount += totalExpenseConverted;
    }
    else {
      totalCreditAmount += totalExpenseConverted * -1;
    }
    if (totalCurrencyConverted > 0) {
      totalDebitAmount += totalCurrencyConverted;
    }
    else {
      totalCreditAmount += totalCurrencyConverted * -1;
    }


    const journalData = {
      status: 'draft',
      journalEntryNum: '',
      remarks: '',
      reference: updatedPayment.paymentNo,
      period: '',
      toReview: false,
      totalCredit: totalCreditAmount,
      totalDebit: totalDebitAmount,
      journalValue: paymentMethodResult.journal._id,
      journalItems: journalItems ? journalItems : [],
      entryDate: updatedPayment.paymentDate,
      modelId: updatedPayment._id,
      modelName: 'Payment'
    };


    await this.journalEntryService.create(journalData);
  }
}
