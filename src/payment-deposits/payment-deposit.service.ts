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
  import { SequenceSettingsService } from 'src/sequence-settings/sequence-settings.service';
  import { CreatePaymentDepositDto } from './dto/create-payment-deposit.dto';
  import { UpdatePaymentDepositDto } from './dto/update-payment-deposit.dto';
  import { CurrenciesService } from 'src/currencies/currencies.service';
  import { ReconcileService } from 'src/reconcile/reconcile.service';
  import { IncotermService } from 'src/incoterm/incoterm.service';
  import { PaymentTermsService } from 'src/payment-terms/payment-terms.service';
  import { JournalEntryService } from 'src/journal-entry/journal-entry.service';
  import {
    PaymentDeposit,
  } from './interfaces/payment-deposit.interface';
  import { TaxesService } from 'src/taxes/taxes.service';
  import { BomsService } from 'src/boms/boms.service';
  import { SkusService } from 'src/skus/skus.service';
  import { ProductsService } from 'src/products/products.service';

  import { DiscountsService } from 'src/discounts/discounts.service';
  import { AccountItemService } from 'src/account-item/account-item.service';
  import { AccountJournalService } from 'src/account-journal/account-journal.service';
  import { FilterDto } from 'src/shared/filter.dto';
  import { WorkOrdersService } from 'src/work-orders/work-orders.service';
  import { typeOfCurrency } from 'src/currencies/dto/create-currency.dto';
  import * as moment from 'moment';
  import { UsersService } from 'src/users/users.service';

  import { InvoiceStatusEnum } from 'src/invoices/dto/create-invoice.dto';
  @Injectable()
  // List of methods of queries to access to database with Respository
  export class PaymentDepositService {
    // added constructor
    constructor(
      @InjectModel('PaymentDeposit')
      private readonly paymentDepositModel: Model<PaymentDeposit>,
      private readonly taxesService: TaxesService,
      private readonly currenciesService: CurrenciesService,
      private readonly incotermService: IncotermService,
      private readonly paymentTermsService: PaymentTermsService,
      private readonly sequenceSettingsService: SequenceSettingsService,
      private readonly bomsService: BomsService,
      private readonly skusService: SkusService,
      private readonly productsService: ProductsService,      
      private readonly discountsService: DiscountsService,
      private readonly workOrdersService: WorkOrdersService,
      @Inject(forwardRef(() => ReconcileService))
      private readonly reconcileService: ReconcileService,
      private readonly accountItemService: AccountItemService,
      private readonly accountJournalService: AccountJournalService,
      private readonly journalEntryService: JournalEntryService,      
      private readonly usersService: UsersService,
    ) {}
  
    // Update latestinvoice Value to False
    async updateOldVersion(id: string) {
      const updatedData = await this.paymentDepositModel.findByIdAndUpdate(
        id,
        { new: true }
      );
      return updatedData;
    }
  
    // Create New Version of invoice
    async createNewVersion(originalPaymentDeposit: PaymentDeposit) {
      
  
      const keys = Object.keys(originalPaymentDeposit);
      keys.forEach((key) => {
        if (originalPaymentDeposit[key] == '') {
          delete originalPaymentDeposit[key];
        }
      });
  
      const newPaymentDeposit = {
        createdDate: new Date(),
        suppNo: originalPaymentDeposit.suppNo,
        suppId: originalPaymentDeposit.suppId,
        custNo: originalPaymentDeposit.custNo,
        custId: originalPaymentDeposit.custId,
        suppName: originalPaymentDeposit.suppName,
        custName: originalPaymentDeposit.custName,
        soNumber: originalPaymentDeposit.soNumber,
        depositNumber: originalPaymentDeposit.depositNumber,
        status: originalPaymentDeposit.status,
        address: originalPaymentDeposit.address,
        telNo: originalPaymentDeposit.telNo,
        faxNo: originalPaymentDeposit.faxNo,
        buyerName: originalPaymentDeposit.buyerName,
        buyerEmail: originalPaymentDeposit.buyerEmail,
        delAddress: originalPaymentDeposit.delAddress,
        paymentAddress: originalPaymentDeposit.paymentAddress,
        paymentTerm: originalPaymentDeposit.paymentTerm,
        currency: originalPaymentDeposit.currency,
        discount: originalPaymentDeposit.discount,
        total: originalPaymentDeposit.total,
        gst: originalPaymentDeposit.gst,
        downPayment: originalPaymentDeposit.downPayment,
        remarks: originalPaymentDeposit.remarks,
        salesOrderItems: originalPaymentDeposit.salesOrderItems,
        exportLocal: originalPaymentDeposit.exportLocal,
        depositType: originalPaymentDeposit.depositType
      };
  
      const createdNewversion = await this.paymentDepositModel.create(newPaymentDeposit);
  
      return this.findOne(createdNewversion._id);
    }
  
    // Create New invoice
    async createNewPaymentDeposit(
      createPaymentDepositDto: CreatePaymentDepositDto
    ): Promise<PaymentDeposit> {
     
      const keys = Object.keys(createPaymentDepositDto);
      keys.forEach((key) => {
        if (createPaymentDepositDto[key] == '') {
          delete createPaymentDepositDto[key];
        }
      });
  
      const newPaymentDeposit = new this.paymentDepositModel(createPaymentDepositDto);
      const createdPaymentDeposit = await newPaymentDeposit.save();
  
      return this.findOne(createdPaymentDeposit._id);
    }
  
    // Find All invoices without Filter
    async findAll(): Promise<PaymentDeposit[]> {
      const response = await this.paymentDepositModel.find().exec();
      return response;
    }
  
    //Find All + Filter
    async getfilters(query: FilterDto): Promise<any> {
      const limit = query.limit ? query.limit : 0;
      const skip = query.skip ? query.skip : 0;
      const filter = query.filter ? query.filter : [];
      const searchText = query.searchText ? query.searchText : '';
      const orderBy = query.orderBy ? query.orderBy : '';
  
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
                const salesOrderFound = await this.paymentDepositModel.find({
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
          } else if (property === 'updatedAt') {
            if (Array.isArray(propVal)) {
              if (propVal[0] === 0) {
                // if Min field is empty, filter lesser
                namedFilter.push({ updatedAt: { $lte: propVal[1] } });
              } else {
                // if Min field is not empty, filter greater and lesser
                namedFilter.push({
                  updatedAt: { $gte: propVal[0], $lte: propVal[1] },
                });
              }
            } else {
              // if Max field is empty, it is not in Array
              namedFilter.push({ updatedAt: { $gte: propVal } });
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
            { creditNoteNumber: searchPattern }, // PaymentDeposit Number
            { custName: searchPattern }, // Customer name
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
  
      const invoices = await this.paymentDepositModel
        .find(where)
        .skip(skip)
        .limit(limit)
        .sort(orderBy)
        .populate(['currency', 'paymentTerm']);

        invoices.map(async(inv)=>{
          if(inv.depositType=='customer'){
          let recon=await this.reconcileService.getReconcileBalance(inv._id)
         inv.set(`balance`,recon,{strict:false})
          }
          else if(inv.depositType=='supplier'){
            let suprecon=await this.reconcileService.getSupplierReconcileBalance(inv.id);
            inv.set(`balance`,suprecon,{strict:false})
          }
        })
  
      const count = await this.paymentDepositModel.countDocuments(where);
     // console.log('invoice',invoices)
      return [invoices, count];
    }
  
    // Simple Find PaymentDeposit by Id
    async findStatusById(id: string): Promise<PaymentDeposit> {
      return await this.paymentDepositModel.findOne({ _id: id }).exec();
    }
  
    
  
    // Find Single PaymentDeposit
    async findOne(id: string): Promise<PaymentDeposit> {
      const response = await this.paymentDepositModel
        .findOne({ _id: id })
        .populate('paymentTerm')
        .populate('currency')
        .populate('Tax')
        .exec();

        if (!response) {
          throw new InternalServerErrorException(`This invoice doesn't exist`);
        }
  
        for (const inv of response.salesOrderItems) {
          try {
            const accountItem = await this.accountItemService.findOne(inv.account);
            if (accountItem) {
              inv.set('account_name', accountItem.accountName, { strict: false });
            }
          }
          catch(error){
            console.log("invalid account");
          }
          
        }
        if(response.depositType=='customer'){
        let recon=await this.reconcileService.getReconcileBalance(response._id);
          response.set(`balance`,recon,{strict:false});
      }
        else if(response.depositType=='supplier'){
          let supprecon=await this.reconcileService.getSupplierReconcileBalance(response._id);
          response.set(`balance`,supprecon,{strict:false});
        }
        
        
      
      
      return response;
    }
  
    // Update single invoice by Id
    async update(id: string, updatePaymentDepositDto: UpdatePaymentDepositDto) {
      const modelName = 'PaymentDeposit'; // hard-coded first
      const salesOrderFound = await this.paymentDepositModel
        .findOne({ _id: id })
        .exec();
  
      if (!salesOrderFound) {
        throw new InternalServerErrorException(`This item doesn't exist`);
      }
      const { status, soNumber, depositNumber } = salesOrderFound;
  
      if (status === InvoiceStatusEnum.CLOSED) {
        throw new ForbiddenException(
          `PaymentDeposit has been closed, Update is forbidden`
        );
      }
  
      console.log('Welcome to PaymentDeposit update');
  
      // If user Input is 'confirmed' and not same with status in database, proceed
      if (
          updatePaymentDepositDto.status === InvoiceStatusEnum.CONFIRMED &&
          updatePaymentDepositDto.status !== status
      ) {
  
        //if (depositNumber) {
          // If has soNumber, proceed update but do not run sequence function
          /*
          console.log(
            `You have number: ${depositNumber}, you are copyVersion, just proceed to update, No sequence settting is executed`
          );
          */
        //} else {
          // No sequence number, proceed sequence function and save/update
          const settingsFound = await this.sequenceSettingsService.FindSequenceByModelName(
            modelName
          );
          if (!settingsFound) {
            throw new InternalServerErrorException('Model name does not exist!');
          }
  
          //check that all account items are set
          if(!updatePaymentDepositDto.account){
            throw new BadRequestException("Account must be set to confirm deposit");          
          }
  
          for (let i = 0; i < updatePaymentDepositDto.salesOrderItems.length; i++) {
            if(!updatePaymentDepositDto.salesOrderItems[i].account){
              throw new BadRequestException("Account must be set to confirm deposit");          
            }
          }
  
          // Generate pattern
          if(!depositNumber){
            const newSequenceValue = this.sequenceSettingsService.sequenceSettingEx(
              settingsFound
            );
    
            updatePaymentDepositDto.depositNumber = newSequenceValue;
                
            //const { nextNumber } = settingsFound;
            if (settingsFound) {
              //const newNextNumber = nextNumber + 1;
              const updatedSequence = await this.sequenceSettingsService.updateSequenceByModelName(
                modelName,
                settingsFound
              );
              if (!updatedSequence) {
                throw new InternalServerErrorException(
                  'Sequence Setting Failed to update!'
                );
              }
            }
          }
          

          if(updatePaymentDepositDto.depositType == "customer"){
              const reconcileData = {
                modelName: 'customer-deposit',
                modelId: id,
                invoiceNumber: updatePaymentDepositDto.depositNumber,
                custId: updatePaymentDepositDto.custId,
                credit: updatePaymentDepositDto.total,
                debit: 0,
                reconciled: false,
                reconcileId: undefined,
                id: undefined,
                allocation: 0,
                origin: true
            };
    
            this.reconcileService.createNewReconcile(reconcileData);
          }
          else if(updatePaymentDepositDto.depositType == "supplier"){
            const reconcileData = {
                modelName: 'supplier-deposit',
                modelId: id,
                invoiceNumber: updatePaymentDepositDto.depositNumber,
                custId: updatePaymentDepositDto.custId,
                credit: 0,
                debit: updatePaymentDepositDto.total,
                reconciled: false,
                reconcileId: undefined,
                id: undefined,
                allocation: 0,
                origin: true
            };
    
            this.reconcileService.createNewReconcile(reconcileData);
          }
            
        }
        /*
      } else if (
          updatePaymentDepositDto.status === InvoiceStatusEnum.CLOSED &&
          updatePaymentDepositDto.status !== status
      ) {
          //this needs ot be reworked
          //this.reconcileService.updateReconcileClosed({ modelId: id, custId: updatePaymentDepositDto.suppId})
      }
      */
  
  
      const keys = Object.keys(updatePaymentDepositDto);
      keys.forEach((key) => {
        if (updatePaymentDepositDto[key] == '') {
          delete updatePaymentDepositDto[key];
        }
      });
  
      const updatedPaymentDeposit = await this.paymentDepositModel.findByIdAndUpdate(
        { _id: id },
          updatePaymentDepositDto,
        { new: true }
      );
      if (!updatedPaymentDeposit) {
        throw new InternalServerErrorException('debit note failed to update!');
      }
  
      if (updatePaymentDepositDto.status === InvoiceStatusEnum.CONFIRMED && updatePaymentDepositDto.status !== status) {
          this.createJournalEntry(updatedPaymentDeposit);
      }
  
      const result = await this.findOne(id);
  
      return result;
    }
  
    
  
    // Delete PaymentDeposit by Id
    async removeOne(id: string) {
      // find sales oder by ID
      const invoiceFound = await this.paymentDepositModel
        .findOne({ _id: id })
        .exec();
  
      if (!invoiceFound) {
        throw new InternalServerErrorException(`This debit note doesn't exist`);
      }
  
      const { status } = invoiceFound;
      // if status is not confirmed, Proceed to Delete
      if (status !== 'confirmed') {
        console.log(
          'Let proceed to delete this invoice as invoice is not confirmed'
        );
  
        
  
        // Remove SalesOrder Document
        const deletedSalesOrder = await this.paymentDepositModel.findByIdAndRemove({
          _id: id,
        });
        return deletedSalesOrder;
      }
      throw new ForbiddenException(
        `This invoice has been confirmed. Deletion is forbidden`
      );
    }
  
    async getPaymentDeposit(id: string): Promise<PaymentDeposit> {
      const response = await this.paymentDepositModel.findOne(
        { _id: id },
        'soNumber suppName suppId delAddress'
      );
      if (!response) {
        throw new NotFoundException('invoice not found!');
      }
      return response;
    }
  
    async findPaymentDeposit(id: string): Promise<PaymentDeposit> {
        return this.paymentDepositModel.findOne({_id: id});
    }
  
    async updateStatus(id: string, status: string): Promise<any> {
      return this.paymentDepositModel.findByIdAndUpdate(
          id,
          { status: status },
          { new: true }
      );
    }


    async getPaymentDepositPDF(id:string){
      const creditNote=await this.paymentDepositModel.findById(id);
  
      if(!creditNote){
        throw new NotFoundException('Deposit not found')
      }
      const paymentTerm=await this.paymentTermsService.findOne(creditNote.paymentTerm)
      const currency=await this.currenciesService.findOne(creditNote.currency);
      const creditNoteDate=moment(creditNote.invoiceDate).format('Do MMMM YYYY');
      let deliveryRemark = "";
      let custPoNum = "";
      let salesPicFirstname = "";
      let salesPicLastName = "";
      /*
      if(creditNote.soNumber){
        let saleOrder=await this.salesOrderService.findByName(creditNote.soNumber);
        deliveryRemark=saleOrder.deliveryRemark;
        custPoNum=saleOrder.custPoNum;
        if(saleOrder.salesPic){
          let salesPic=await this.usersService.findOnePic(saleOrder.salesPic);
          salesPicFirstname=salesPic.firstName;
          salesPicLastName=salesPic.lastName;
        }
      }
      */
      let gstAmt = 0;
      if(creditNote.gst > 0){
        gstAmt = Math.round(creditNote.total * creditNote.gst)/100;
      }
      let total = creditNote.total;
      let discountName = "";
      let discount=Number(creditNote.discount)
      total=total-discount
  
      const creditNotePayload={
        suppNo:creditNote.suppNo,
        soNumber:creditNote.soNumber,
        suppName:creditNote.suppName,
        address:creditNote.address,
        telNo:creditNote.telNo,
        faxNo:creditNote.faxNo,
        buyerName: creditNote.buyerName,
        buyerEmail: creditNote.buyerEmail,
        delAddress: creditNote.delAddress,
        remarks: creditNote.remarks,
        paymentAddress: creditNote.paymentAddress,
        status: creditNote.status,
        paymentTerm: paymentTerm ? paymentTerm.name : '', // pop
        currency: currency ? currency.name : '', // pop
        currencySymbol: currency ? currency.currencySymbol : '', // pop
        symbol: currency ? currency.symbol : '', // pop
        total: creditNote.total,
        grandTotal: creditNote.total,
        gst: creditNote.gst,
        gstAmt: gstAmt,
        discountAmt: creditNote.discount,
        discountName: discountName,
        // balance: creditNote.total - creditNote.downPayment,
        salesOrderItems: creditNote.salesOrderItems,
        taxInvNum: creditNote.depositNumber,
        creditNoteDate: creditNoteDate,
        deliveryRemark: deliveryRemark,
        custPoNum: custPoNum,
        salesPicLastName: salesPicLastName,
        salesPicFirstname: salesPicFirstname
      }
  return creditNotePayload;
    }
  
    async createJournalEntry(updatedPaymentDeposit: any) {
      const journalItems = [];
      let totalInvoices = 0;
      let currencyRate = 1;
      let taxAmt = 0;
      let taxResult;
  
      if (updatedPaymentDeposit.currency) {
        //get latest currency
        const theCurrency = await this.currenciesService.findOne(
          updatedPaymentDeposit.currency,
        );
        if (theCurrency && theCurrency.currencyRate) {
          for (let i = 0; i < theCurrency.currencyRate.length; i++) {
            if (theCurrency.currencyRate[i].type == typeOfCurrency.Sale) {
              currencyRate = 1 / theCurrency.currencyRate[i].rate;
              break;
            }
          }
        }
      }
  
      updatedPaymentDeposit.salesOrderItems.map(item => { totalInvoices += item.extPrice });
      if (updatedPaymentDeposit.exportLocal == 'local') {
        taxResult = await this.taxesService.findByName('local');
        // console.log('taxR',taxResult)
        if (taxResult) {
          taxAmt = (updatedPaymentDeposit.gst / 100) * totalInvoices;
        }
      }
      let partnerName = updatedPaymentDeposit.depositType == "customer" ? updatedPaymentDeposit.custName : updatedPaymentDeposit.suppName;
  
      let firstLine = {
        reference: updatedPaymentDeposit.depositNumber,
        name: updatedPaymentDeposit.depositNumber,
        partner: partnerName,
        account: updatedPaymentDeposit.account,
        dueDate: updatedPaymentDeposit.invoiceDate ? updatedPaymentDeposit.invoiceDate : '',
        debit: 0,
        credit: (totalInvoices + taxAmt) * currencyRate,
        amountCurrency: totalInvoices + taxAmt,
        currency: updatedPaymentDeposit.currency,
        taxAmount: 0,
        reconcile: '',
        partialReconcile: ''
      };
      journalItems.push(firstLine);
  
      updatedPaymentDeposit.salesOrderItems.map(item => {
        let productItem = {
          reference: updatedPaymentDeposit.depositNumber,
          name: item.description,
          partner: partnerName,
          account: item.account,
          dueDate: updatedPaymentDeposit.invoiceDate ? updatedPaymentDeposit.invoiceDate : '',
          debit: item.extPrice * currencyRate,
          credit: 0,
          amountCurrency: item.extPrice,
          currency: updatedPaymentDeposit.currency,
          taxAmount: 0,
          reconcile: '',
          partialReconcile: ''
        };
  
        journalItems.push(productItem);
      });
  
      if (updatedPaymentDeposit.exportLocal == "local") {
        
  
        if (taxResult) {
          let taxItem = {
            reference: updatedPaymentDeposit.depositNumber,
            name: 'Tax',
            partner: partnerName,
            account: taxResult.account,
            dueDate: updatedPaymentDeposit.invoiceDate ? updatedPaymentDeposit.invoiceDate : '',
            debit: taxAmt * currencyRate,
            credit: 0,
            amountCurrency:taxAmt,
            currency: '',
            taxAmount: taxResult.rate,
            reconcile: '',
            partialReconcile: ''
          };
  
          journalItems.push(taxItem);
          totalInvoices += taxAmt;
        }
      }
  
      const journalData = {
        status: 'draft',
        journalEntryNum: '',
        remarks: '',
        reference: updatedPaymentDeposit.depositNumber,
        toReview: false,
        totalCredit: totalInvoices * currencyRate,
        totalDebit: totalInvoices * currencyRate,
        journalValue: updatedPaymentDeposit.journal ? updatedPaymentDeposit.journal : '',
        journalItems: journalItems ? journalItems : [],
        entryDate: updatedPaymentDeposit.invoiceDate,
        modelId:updatedPaymentDeposit._id,
        modelName:'PaymentDeposit'
      };
  
      await this.journalEntryService.create(journalData);
    }
  }
  