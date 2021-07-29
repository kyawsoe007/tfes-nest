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
  import { CreateDebitNoteDto } from './dto/create-debit-note.dto';
  import { UpdateDebitNoteDto } from './dto/update-debit-note.dto';
  import { CurrenciesService } from 'src/currencies/currencies.service';
  import { ReconcileService } from 'src/reconcile/reconcile.service';
  import { IncotermService } from 'src/incoterm/incoterm.service';
  import { PaymentTermsService } from 'src/payment-terms/payment-terms.service';
  import { JournalEntryService } from 'src/journal-entry/journal-entry.service';
  import {
    DebitNote,
  } from './interfaces/debit-note.interface';
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
  export class DebitNoteService {
    // added constructor
    constructor(
      @InjectModel('DebitNote')
      private readonly debitNoteModel: Model<DebitNote>,
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
      const updatedData = await this.debitNoteModel.findByIdAndUpdate(
        id,
        { new: true }
      );
      return updatedData;
    }
  
    // Create New Version of invoice
    async createNewVersion(originalDebitNote: DebitNote) {
      if (originalDebitNote.salesOrderItems.length) {
        for (let i = 0; i < originalDebitNote.salesOrderItems.length; i++) {
          if (originalDebitNote.salesOrderItems[i].bom) {
            let bomList = [];
            const bomObj = await this.bomsService.findOne(
                originalDebitNote.salesOrderItems[i].bom
            );
            for (let j = 0; j < bomObj.productList.length; j++) {
              bomList.push({
                sku: bomObj.productList[j].sku,
                qty: bomObj.productList[j].qty,
              });
            }
            const BomResult = { productList: bomList };
  
            const createdBom = await this.bomsService.create(BomResult);
            bomList = [];
            originalDebitNote.salesOrderItems[i].bom = createdBom._id;
          }
        }
      }
  
      const keys = Object.keys(originalDebitNote);
      keys.forEach((key) => {
        if (originalDebitNote[key] == '') {
          delete originalDebitNote[key];
        }
      });
  
      const newDebitNote = {
        createdDate: new Date(),
        suppNo: originalDebitNote.suppNo,
        suppId: originalDebitNote.suppId,
        suppName: originalDebitNote.suppName,
        soNumber: originalDebitNote.soNumber,
        debitNoteNumber: originalDebitNote.debitNoteNumber,
        status: originalDebitNote.status,
        address: originalDebitNote.address,
        telNo: originalDebitNote.telNo,
        faxNo: originalDebitNote.faxNo,
        buyerName: originalDebitNote.buyerName,
        buyerEmail: originalDebitNote.buyerEmail,
        delAddress: originalDebitNote.delAddress,
        paymentAddress: originalDebitNote.paymentAddress,
        paymentTerm: originalDebitNote.paymentTerm,
        currency: originalDebitNote.currency,
        discount: originalDebitNote.discount,
        total: originalDebitNote.total,
        gst: originalDebitNote.gst,
        downPayment: originalDebitNote.downPayment,
        remarks: originalDebitNote.remarks,
        salesOrderItems: originalDebitNote.salesOrderItems,
        exportLocal: originalDebitNote.exportLocal
      };
  
      const createdNewversion = await this.debitNoteModel.create(newDebitNote);
  
      return this.findOne(createdNewversion._id);
    }
  
    // Create New invoice
    async createNewDebitNote(
      createDebitNoteDto: CreateDebitNoteDto
    ): Promise<DebitNote> {
      if (createDebitNoteDto.salesOrderItems.length) {
        for (let i = 0; i < createDebitNoteDto.salesOrderItems.length; i++) {
          if (
              createDebitNoteDto.salesOrderItems[i].BomList &&
              createDebitNoteDto.salesOrderItems[i].BomList.length > 0
          ) {
            let bomObject = {};
            let bomList = [];
            createDebitNoteDto.salesOrderItems[i].BomList.forEach(
              async (bom) => {
                bomObject = { sku: bom.productId, qty: bom.qtyTwo };
                bomList.push(bomObject);
              }
            );
  
            const BomResult = { productList: bomList };
  
            const bomObj = await this.bomsService.create(BomResult);
            bomList = [];
            createDebitNoteDto.salesOrderItems[i].bom = bomObj._id;
          }
        }
      }
      const keys = Object.keys(createDebitNoteDto);
      keys.forEach((key) => {
        if (createDebitNoteDto[key] == '') {
          delete createDebitNoteDto[key];
        }
      });
  
      const newDebitNote = new this.debitNoteModel(createDebitNoteDto);
      const createdDebitNote = await newDebitNote.save();
  
      return this.findOne(createdDebitNote._id);
    }
  
    // Find All invoices without Filter
    async findAll(): Promise<DebitNote[]> {
      const response = await this.debitNoteModel.find().exec();
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
                const salesOrderFound = await this.debitNoteModel.find({
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
            { creditNoteNumber: searchPattern }, // DebitNote Number
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
  
      const invoices = await this.debitNoteModel
        .find(where)
        .skip(skip)
        .limit(limit)
        .sort(orderBy)
        .populate(['currency', 'paymentTerm']);
  
      const count = await this.debitNoteModel.countDocuments(where);
      return [invoices, count];
    }
  
    // Simple Find DebitNote by Id
    async findStatusById(id: string): Promise<DebitNote> {
      return await this.debitNoteModel.findOne({ _id: id }).exec();
    }
  
    
  
    // Find Single DebitNote
    async findOne(id: string): Promise<DebitNote> {
      const response = await this.debitNoteModel
        .findOne({ _id: id })
        .populate('paymentTerm')
        .populate('currency')
        .populate('Tax')
        .exec();
  
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
    
        if (!response) {
          throw new InternalServerErrorException(`This invoice doesn't exist`);
        }
      
      
      return response;
    }
  
    // Update single invoice by Id
    async update(id: string, updateDebitNoteDto: UpdateDebitNoteDto) {
      const modelName = 'DebitNote'; // hard-coded first
      const salesOrderFound = await this.debitNoteModel
        .findOne({ _id: id })
        .exec();
  
      if (!salesOrderFound) {
        throw new InternalServerErrorException(`This invoice doesn't exist`);
      }
      const { status, soNumber, debitNoteNumber } = salesOrderFound;
  
      if (status === InvoiceStatusEnum.CLOSED) {
        throw new ForbiddenException(
          `DebitNote has been closed, Update is forbidden`
        );
      }
  
      console.log('Welcome to DebitNote update');
  
      // If user Input is 'confirmed' and not same with status in database, proceed
      if (
          updateDebitNoteDto.status === InvoiceStatusEnum.CONFIRMED &&
          updateDebitNoteDto.status !== status
      ) {
        console.log('Let proceed to confirm this credit note');
  
        /*
        if (debitNoteNumber) {
          // If has soNumber, proceed update but do not run sequence function
          console.log(
            `You have creditNoteNumber: ${debitNoteNumber}, you are copyVersion, just proceed to update, No sequence settting is executed`
          );
        } else {
          */
          // No sequence number, proceed sequence function and save/update
          
  
          //check that all account items are set
          if(!updateDebitNoteDto.account){
            throw new BadRequestException("Account must be set to confirm invoice");          
          }
  
          for (let i = 0; i < updateDebitNoteDto.salesOrderItems.length; i++) {
            if(!updateDebitNoteDto.salesOrderItems[i].account){
              throw new BadRequestException("Account must be set to confirm invoice");          
            }
          }

          if(!debitNoteNumber){
            const settingsFound = await this.sequenceSettingsService.FindSequenceByModelName(
              modelName
            );
            if (!settingsFound) {
              throw new InternalServerErrorException('Model name does not exist!');
            }
    
            // Generate pattern
            const newSequenceValue = this.sequenceSettingsService.sequenceSettingEx(
              settingsFound
            );
            updateDebitNoteDto.debitNoteNumber = newSequenceValue;

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
          
  
          const reconcileData = {
              modelName: 'debit-note',
              modelId: id,
              invoiceNumber: updateDebitNoteDto.debitNoteNumber,
              custId: updateDebitNoteDto.suppId,
              credit: 0,
              debit: updateDebitNoteDto.total,
              reconciled: false,
              reconcileId: undefined,
              id: undefined,
              allocation: 0,
              origin: true
          };
  
          this.reconcileService.createNewReconcile(reconcileData);
        //}
      } else if (
          updateDebitNoteDto.status === InvoiceStatusEnum.CLOSED &&
          updateDebitNoteDto.status !== status
      ) {
          //this needs ot be reworked
          //this.reconcileService.updateReconcileClosed({ modelId: id, custId: updateDebitNoteDto.suppId})
      }
  
  
      const keys = Object.keys(updateDebitNoteDto);
      keys.forEach((key) => {
        if (updateDebitNoteDto[key] == '') {
          delete updateDebitNoteDto[key];
        }
      });
  
      const updatedDebitNote = await this.debitNoteModel.findByIdAndUpdate(
        { _id: id },
          updateDebitNoteDto,
        { new: true }
      );
      if (!updatedDebitNote) {
        throw new InternalServerErrorException('debit note failed to update!');
      }
  
      if (updateDebitNoteDto.status === InvoiceStatusEnum.CONFIRMED && updateDebitNoteDto.status !== status) {
          this.createJournalEntry(updatedDebitNote);
      }
  
      const result = await this.findOne(id);
  
      return result;
    }
  
    
  
    // Delete DebitNote by Id
    async removeOne(id: string) {
      // find sales oder by ID
      const invoiceFound = await this.debitNoteModel
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
        const deletedSalesOrder = await this.debitNoteModel.findByIdAndRemove({
          _id: id,
        });
        return deletedSalesOrder;
      }
      throw new ForbiddenException(
        `This invoice has been confirmed. Deletion is forbidden`
      );
    }
  
    async getDebitNote(id: string): Promise<DebitNote> {
      const response = await this.debitNoteModel.findOne(
        { _id: id },
        'soNumber suppName suppId delAddress'
      );
      if (!response) {
        throw new NotFoundException('invoice not found!');
      }
      return response;
    }
  
    async findDebitNote(id: string): Promise<DebitNote> {
        return this.debitNoteModel.findOne({_id: id});
    }
  
    async updateStatus(id: string, status: string): Promise<any> {
      return this.debitNoteModel.findByIdAndUpdate(
          id,
          { status: status },
          { new: true }
      );
    }


    async getDebitNotePDF(id:string){
      const creditNote=await this.debitNoteModel.findById(id);
  
      if(!creditNote){
        throw new NotFoundException('Credit-Note not fount')
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
        taxInvNum: creditNote.debitNoteNumber,
        creditNoteDate: creditNoteDate,
        deliveryRemark: deliveryRemark,
        custPoNum: custPoNum,
        salesPicLastName: salesPicLastName,
        salesPicFirstname: salesPicFirstname
      }
  return creditNotePayload;
    }
  
    async createJournalEntry(updatedDebitNote: any) {
      const journalItems = [];
      let totalInvoices = 0;
      let currencyRate = 1;
      let taxAmt = 0;
      let taxResult;
  
      if (updatedDebitNote.currency) {
        //get latest currency
        const theCurrency = await this.currenciesService.findOne(
          updatedDebitNote.currency,
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
  
      updatedDebitNote.salesOrderItems.map(item => { totalInvoices += item.extPrice });
      if (updatedDebitNote.exportLocal == 'local') {
        taxResult = await this.taxesService.findByName('local');
        // console.log('taxR',taxResult)
        if (taxResult) {
          taxAmt = (updatedDebitNote.gst / 100) * totalInvoices;
        }
      }
      
  
      let firstLine = {
        reference: updatedDebitNote.creditNoteNumber,
        name: updatedDebitNote.creditNoteNumber,
        partner: updatedDebitNote.suppName,
        partner_id: updatedDebitNote.suppId, 
        account: updatedDebitNote.account,
        dueDate: updatedDebitNote.invoiceDate ? updatedDebitNote.invoiceDate : '',
        debit: (totalInvoices + taxAmt) * currencyRate,
        credit: 0,
        amountCurrency: totalInvoices + taxAmt,
        currency: updatedDebitNote.currency,
        taxAmount: 0,
        reconcile: '',
        partialReconcile: ''
      };
      journalItems.push(firstLine);
  
      updatedDebitNote.salesOrderItems.map(item => {
        let productItem = {
          reference: updatedDebitNote.creditNoteNumber,
          name: item.description,
          partner: updatedDebitNote.suppName,
          partner_id: updatedDebitNote.suppId,
          account: item.account,
          dueDate: updatedDebitNote.invoiceDate ? updatedDebitNote.invoiceDate : '',
          debit: 0,
          credit: item.extPrice * currencyRate,
          amountCurrency: item.extPrice,
          currency: updatedDebitNote.currency,
          taxAmount: 0,
          reconcile: '',
          partialReconcile: ''
        };
  
        journalItems.push(productItem);
      });
  
      if (updatedDebitNote.exportLocal == "local") {
        
  
        if (taxResult) {
          let taxItem = {
            reference: updatedDebitNote.creditNoteNumber,
            name: 'Tax',
            partner: updatedDebitNote.suppName,
            partner_id: updatedDebitNote.suppId,
            account: taxResult.account,
            dueDate: updatedDebitNote.invoiceDate ? updatedDebitNote.invoiceDate : '',
            debit: 0,
            credit: taxAmt * currencyRate,
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
        reference: updatedDebitNote.debitNoteNumber,
        toReview: false,
        totalCredit: totalInvoices * currencyRate,
        totalDebit: totalInvoices * currencyRate,
        journalValue: updatedDebitNote.journal ? updatedDebitNote.journal : '',
        journalItems: journalItems ? journalItems : [],
        entryDate: updatedDebitNote.invoiceDate,
        modelId:updatedDebitNote._id,
        modelName:'DebitNote'
      };
  
      await this.journalEntryService.create(journalData);
    }
  }
  