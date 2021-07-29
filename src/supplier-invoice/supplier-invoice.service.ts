import {
  ForbiddenException,
  forwardRef,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose'; // Added new Line
import * as moment from 'moment';

import { Model } from 'mongoose'; // Added new line
import { SequenceSettingsService } from 'src/sequence-settings/sequence-settings.service';
import { CreateSupplierInvoiceDto } from './dto/create-supplier-invoice.dto';
import { UpdateSupplierInvoiceDto } from './dto/update-supplier-invoice.dto';
import { CurrenciesService } from 'src/currencies/currencies.service';
import { IncotermService } from 'src/incoterm/incoterm.service';
import { PaymentTermsService } from 'src/payment-terms/payment-terms.service';
import { SupplierInvoice } from './interfaces/supplier-invoice.interface';
import { TaxesService } from 'src/taxes/taxes.service';
import { BomsService } from 'src/boms/boms.service';
import { SkusService } from 'src/skus/skus.service';
import { ProductsService } from 'src/products/products.service';
import { QuotationsService } from 'src/quotations/quotations.service';
import { DiscountsService } from 'src/discounts/discounts.service';
import { FilterDto } from 'src/shared/filter.dto';
import { WorkOrdersService } from 'src/work-orders/work-orders.service';
import { ReconcileService } from 'src/reconcile/reconcile.service';
import { AccountItemService } from 'src/account-item/account-item.service';
import { JournalEntryService } from 'src/journal-entry/journal-entry.service';
import { typeOfCurrency } from 'src/currencies/currencies.interface';
import { AccountJournalService } from 'src/account-journal/account-journal.service';
import { PurchaseSettingService } from 'src/purchase-setting/purchase-setting.service';
import { SupplierService } from 'src/supplier/supplier.service';
import { InvoiceStatusEnum } from 'src/invoices/dto/create-invoice.dto';
import { PurchasesService } from '../purchase-order/purchase-order.service';
import { InvStatusEnumDto } from '../purchase-order/dto/create-purchase-order.dto';
import { ExpensesClaimService } from '../expenses-claim/expenses-claim.service';
import { ExpClaimStatusEnumDto } from '../expenses-claim/dto/create-expenses-claim.dto';

@Injectable()
// List of methods of queries to access to database with Respository
export class SupplierInvoiceService {
  // added constructor
  constructor(
    @InjectModel('SupplierInvoice')
    private readonly supplierinvoiceModel: Model<SupplierInvoice>,
    private readonly taxesService: TaxesService,
    private readonly currenciesService: CurrenciesService,
    private readonly incotermService: IncotermService,
    private readonly paymentTermsService: PaymentTermsService,
    private readonly sequenceSettingsService: SequenceSettingsService,
    private readonly bomsService: BomsService,
    private readonly skusService: SkusService,
    private readonly productsService: ProductsService,
    private readonly quotationsService: QuotationsService,
    private readonly discountsService: DiscountsService,
    private readonly workOrdersService: WorkOrdersService,
    @Inject(forwardRef(() => ReconcileService))
    private readonly reconcileService: ReconcileService,
    private readonly accountItemService: AccountItemService,
    private readonly journalEntryService: JournalEntryService,
    private readonly accountJournalService: AccountJournalService,
    private readonly purchaseSettingService: PurchaseSettingService,
    private readonly supplierService: SupplierService,
    private readonly purchasesService: PurchasesService,
    private readonly expensesClaimService: ExpensesClaimService,
  ) {}

  // Update latestinvoice Value to False
  async updateOldVersion(id: string) {
    const updatedData = await this.supplierinvoiceModel.findByIdAndUpdate(id, {
      new: true,
    });
    return updatedData;
  }

  // Create New Version of invoice
  async createNewVersion(originalInvoice: SupplierInvoice) {
    if (originalInvoice.salesOrderItems.length) {
      for (let i = 0; i < originalInvoice.salesOrderItems.length; i++) {
        if (originalInvoice.salesOrderItems[i].bom) {
          let bomList = [];
          const bomObj = await this.bomsService.findOne(
            originalInvoice.salesOrderItems[i].bom,
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
          originalInvoice.salesOrderItems[i].bom = createdBom._id;
        }
      }
    }

    const keys = Object.keys(originalInvoice);
    keys.forEach((key) => {
      if (originalInvoice[key] == '') {
        delete originalInvoice[key];
      }
    });

    const newInvoice = {
      createdDate: new Date(),
      suppNo: originalInvoice.suppNo,
      suppId: originalInvoice.suppId,
      suppName: originalInvoice.suppName,
      soNumber: originalInvoice.soNumber,
      invoiceNumber: originalInvoice.invoiceNumber,
      invoiceDate: originalInvoice.invoiceDate,
      status: originalInvoice.status,
      address: originalInvoice.address,
      telNo: originalInvoice.telNo,
      faxNo: originalInvoice.faxNo,
      buyerName: originalInvoice.buyerName,
      buyerEmail: originalInvoice.buyerEmail,
      delAddress: originalInvoice.delAddress,
      paymentAddress: originalInvoice.paymentAddress,
      paymentTerm: originalInvoice.paymentTerm,
      currency: originalInvoice.currency,
      discount: originalInvoice.discount,
      total: originalInvoice.total,
      gst: originalInvoice.gst,
      downPayment: originalInvoice.downPayment,
      remarks: originalInvoice.remarks,
      salesOrderItems: originalInvoice.salesOrderItems,
      exportLocal: originalInvoice.exportLocal,
    };

    const createdNewversion = await this.supplierinvoiceModel.create(
      newInvoice,
    );

    return this.findOne(createdNewversion._id);
  }
  // Create New invoice
  async createNewInvoice(
    createSupplierInvoiceDto: CreateSupplierInvoiceDto,
  ): Promise<SupplierInvoice> {
    const keys = Object.keys(createSupplierInvoiceDto);
    keys.forEach((key) => {
      if (createSupplierInvoiceDto[key] == '') {
        delete createSupplierInvoiceDto[key];
      }
    });
    //skip checking of id
    /*
    if(!createSupplierInvoiceDto.suppId || createSupplierInvoiceDto.suppId == ""){
      let supplier = await this.supplierService.findBySupplierNo(createSupplierInvoiceDto.suppNo);
      if(!supplier || supplier == null){
        throw new NotFoundException("Supplier Id is missing!");
      }
      createSupplierInvoiceDto.suppId = supplier._id;
    }
    */
    const newInvoice = new this.supplierinvoiceModel(createSupplierInvoiceDto);
    const createdInvoice = await newInvoice.save();

    const purchaseInvStatus = InvStatusEnumDto.INVOICED;
    await this.purchasesService.updatePurchaseInvStatus(
      createSupplierInvoiceDto.poNumber,
      purchaseInvStatus,
    );

    return this.findOne(createdInvoice._id);
  }

  // Find All invoices without Filter
  async findAll(): Promise<SupplierInvoice[]> {
    const response = await this.supplierinvoiceModel.find().exec();
    return response;
  }

  //Find All + Filter
  async getfilters(query: FilterDto): Promise<any> {
    const limit = query.limit ? query.limit : 0;
    const skip = query.skip ? query.skip : 0;
    const filter = query.filter ? query.filter : [];
    const searchText = query.searchText ? query.searchText : '';
    const orderBy =
      query.orderBy && Object.keys(query.orderBy).length > 0
        ? query.orderBy
        : { invoiceNumber: -1 };

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
              const salesOrderFound = await this.supplierinvoiceModel.find({
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
        } else if (property === 'invoiceDate') {
          if (Array.isArray(propVal)) {
            if (propVal[0] === 0) {
              // if Min field is empty, filter lesser
              namedFilter.push({ invoiceDate: { $lte: propVal[1] } });
            } else {
              // if Min field is not empty, filter greater and lesser
              // https://stackoverflow.com/questions/55108562/why-does-eq-comparison-is-not-working-on-mongodb-with-dates
              let upperBoundDate = new Date(propVal[1]);
              upperBoundDate.setDate(upperBoundDate.getDate() + 1)
              namedFilter.push({
                invoiceDate: { $gte: propVal[0], $lte: upperBoundDate },
              })
            }
          } else {
            // if Max field is empty, it is not in Array
            namedFilter.push({ invoiceDate: { $gte: propVal } });
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
          { suppNo: searchPattern }, // supp number
          { suppInvoiceNo: searchPattern }, // supp invoice number
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

    const invoices = await this.supplierinvoiceModel
      .find(where)
      .skip(skip)
      .limit(limit)
      .sort(orderBy)
      .populate(['currency', 'paymentTerm']);

    const count = await this.supplierinvoiceModel.countDocuments(where);
    return [invoices, count];
  }

  // Simple Find Invoice by Id
  async findStatusById(id: string): Promise<SupplierInvoice> {
    return await this.supplierinvoiceModel.findOne({ _id: id }).exec();
  }

  // Fetch All Quotations Group
  async findAllInvoiceDropdownGroup() {
    const paymentTerm = await this.paymentTermsService.findAll();
    const currency = await this.currenciesService.findAll();
    const gst = await this.taxesService.findAll();
    const discount = await this.discountsService.findAll();

    return {
      paymentTerm: paymentTerm ? paymentTerm : [],
      gst: gst ? gst : [],
      currency: currency ? currency : [],
      discount: discount ? discount : [],
    };
  }

  // Find Single Invoice
  async findOne(id: string): Promise<SupplierInvoice> {
    const response = await this.supplierinvoiceModel
      .findOne({ _id: id })
      .populate('paymentTerm')
      .populate('currency')
      .populate('Tax')
      .exec();
    for (const inv of response.salesOrderItems) {
      const accountItem = await this.accountItemService.findOne(inv.account);
      if (accountItem) {
        inv.set('account_name', accountItem.accountName, { strict: false });
      }
    }
    if (!response) {
      throw new InternalServerErrorException(`This invoice doesn't exist`);
    }

    return response;
  }

  // Update single invoice by Id
  async update(id: string, updateSupplierInvoiceDto: UpdateSupplierInvoiceDto) {
    const modelName = 'SupplierInvoice'; // hard-coded first
    const salesOrderFound = await this.supplierinvoiceModel
      .findOne({ _id: id })
      .exec();

    if (!salesOrderFound) {
      throw new InternalServerErrorException(`This invoice doesn't exist`);
    }
    const { status, soNumber, invoiceNumber } = salesOrderFound;
    /*
    if (status === 'completed') {
      throw new ForbiddenException(
        `Invoice are has been completed, Update is forbidden`,
      );
    }
    */

    console.log('Welcome to Invoice update');

    // If user Input is 'confirmed' and not same with status in database, proceed
    if (
      updateSupplierInvoiceDto.status === InvoiceStatusEnum.CONFIRMED &&
      updateSupplierInvoiceDto.status !== status
    ) {
      console.log('Let proceed to confirm this invoice');

      //if (invoiceNumber) {
        // If has soNumber, proceed update but do not run sequence function
        /*
        console.log(
          `You have invoiceNumber: ${invoiceNumber}, you are copyVersion, just proceed to update, No sequence settting is executed`,
        );
        */
      //} else {
        // No sequence number, proceed sequence function and save/update
        if(!invoiceNumber){
          const settingsFound = await this.sequenceSettingsService.FindSequenceByModelName(
            modelName,
          );
          if (!settingsFound) {
            throw new InternalServerErrorException('Model name does not exist!');
          }
  
          // Generate pattern
          const newSequenceValue = this.sequenceSettingsService.sequenceSettingEx(
            settingsFound,
          );
  
          updateSupplierInvoiceDto.invoiceNumber = newSequenceValue;
          if (settingsFound) {
            //const newNextNumber = nextNumber + 1;
            const updatedSequence = await this.sequenceSettingsService.updateSequenceByModelName(
              modelName,
              settingsFound,
            );
            if (!updatedSequence) {
              throw new InternalServerErrorException(
                'Sequence Setting Failed to update!',
              );
            }
          }
        }
        
        updateSupplierInvoiceDto.status = InvoiceStatusEnum.UNPAID;
        
        

        if (updateSupplierInvoiceDto.currency) {
          const currency = await this.currenciesService.findOne(
            updateSupplierInvoiceDto.currency,
          );
          for (let i = 0; i < currency.currencyRate.length; i++) {
            if (currency.currencyRate[i].type == typeOfCurrency.Purchase) {
              if (currency.currencyRate[i].rate > 0) {
                updateSupplierInvoiceDto.currencyRate = currency.latestRate;
                break;
              }
            }
          }
        }

        const reconcileData = {
            modelName: 'supplierinvoice',
            modelId: id,
            invoiceNumber: updateSupplierInvoiceDto.invoiceNumber ,
            custId: updateSupplierInvoiceDto.suppId,
            credit: updateSupplierInvoiceDto.grandTotal,
            debit: 0,
            reconciled: false,
            reconcileId: undefined,
            id: undefined,
            allocation: 0,
            origin: true
        };
        const supplierReconcileOne=await this.reconcileService.findOneReconcile(id)
        if(!supplierReconcileOne){ 
          await this.reconcileService.createNewReconcile(reconcileData);
            
        }
        else{
          supplierReconcileOne.invoiceNumber=updateSupplierInvoiceDto.invoiceNumber ,
          supplierReconcileOne.custId=updateSupplierInvoiceDto.suppId,
          supplierReconcileOne.credit =updateSupplierInvoiceDto.grandTotal
          await this.reconcileService.updateReconcileInvoice(id,supplierReconcileOne)
        }
        //check expenseType
        //hardcode creditor account
        if (!updateSupplierInvoiceDto.journal) {
          const purchaseJournal = await this.accountJournalService.findOneByName(
            'Purchase',
          );
          if (purchaseJournal) {
            updateSupplierInvoiceDto.account = purchaseJournal.credit_account;
            updateSupplierInvoiceDto.journal = purchaseJournal._id;
          }
          //purchase settings
          const pSettings = await this.purchaseSettingService.findAll();
          updateSupplierInvoiceDto.salesOrderItems.forEach((item) => {
            for (let i = 0; i < pSettings.length; i++) {
              if (item.expenseType == pSettings[i].setting_name) {
                item.account = pSettings[i].account;
              }
            }
          });
        }

        // Update Expenses Claim Status if any
        if (updateSupplierInvoiceDto.claimId !== '') {
          const expensesClaimStatus = ExpClaimStatusEnumDto.PAID;
          await this.expensesClaimService.updateClaimStatus(
            updateSupplierInvoiceDto.claimId,
            expensesClaimStatus,
          );
        }
      
    }

    //create all the boms

    /*
    const keys = Object.keys(updateSupplierInvoiceDto);
    keys.forEach((key) => {
      if (updateSupplierInvoiceDto[key] == '') {
        delete updateSupplierInvoiceDto[key];
      }
    });
*/
    const purchaseInvStatus = InvStatusEnumDto.INVOICED;
    await this.purchasesService.updatePurchaseInvStatus(
      updateSupplierInvoiceDto.poNumber,
      purchaseInvStatus,
    );

    const updatedInvoice = await this.supplierinvoiceModel.findByIdAndUpdate(
      { _id: id },
      updateSupplierInvoiceDto,
      { new: true },
    );
    if (!updatedInvoice) {
      throw new InternalServerErrorException('invoice failed to update!');
    }

    // Ensure to generate one WorkOrder only
    if (
      updatedInvoice.status === InvoiceStatusEnum.UNPAID &&
      updatedInvoice.toggleGenerateWO === true
    ) {
      console.log('Please generate WorkOrder');

      // switch of WO generator
      await this.supplierinvoiceModel.findByIdAndUpdate(
        { _id: updatedInvoice.id },
        { toggleGenerateWO: false },
        { new: true },
      );
    }

    if (
      updateSupplierInvoiceDto.status === InvoiceStatusEnum.UNPAID &&
      updateSupplierInvoiceDto.status !== status
    ) {
      //  console.log('createJournalEntry',updatedInvoice)
      this.createJournalEntry(updatedInvoice);
    }

    const result = await this.findOne(id);

    return result;
  }

  // Delete Invoice by Id
  async removeOne(id: string) {
    // find sales oder by ID
    const invoiceFound = await this.supplierinvoiceModel
      .findOne({ _id: id })
      .exec();

    if (!invoiceFound) {
      throw new InternalServerErrorException(`This invoice doesn't exist`);
    }

    const { status } = invoiceFound;
    // if status is not confirmed, Proceed to Delete
    if (status !== 'confirmed') {
      console.log(
        'Let proceed to delete this invoice as invoice is not confirmed',
      );

      // Remove Bom Document
      invoiceFound.salesOrderItems.forEach(async (item: { bom: string }) => {
        if (item.bom) {
          await this.bomsService.remove(item.bom);
        }
      });

      // Remove SalesOrder Document
      const deletedSalesOrder = await this.supplierinvoiceModel.findByIdAndRemove(
        {
          _id: id,
        },
      );
      return deletedSalesOrder;
    }
    throw new ForbiddenException(
      `This invoice has been confirmed. Deletion is forbidden`,
    );
  }

  async getInvoice(id: string): Promise<SupplierInvoice> {
    const response = await this.supplierinvoiceModel.findOne(
      { _id: id },
      'soNumber suppName suppId delAddress',
    );
    if (!response) {
      throw new NotFoundException('invoice not found!');
    }
    return response;
  }

  async findInvoice(id: string): Promise<SupplierInvoice> {
    return this.supplierinvoiceModel.findOne({ _id: id });
  }

  async updateStatus(id: string, status: string): Promise<any> {
    return this.supplierinvoiceModel.findByIdAndUpdate(
      id,
      { status: status },
      { new: true },
    );
  }

  async createJournalEntry(updatedInvoice: any) {
    const journalItems = [];
    let totalInvoices = 0;
    let currencyRate = 1;
    let taxAmt = 0;
    let taxResult;
    console.log('journal entry created');
    updatedInvoice.salesOrderItems.map((item) => {
      totalInvoices += item.extPrice;
    });
    let discountPercent = 1;
    if (updatedInvoice.discountAmount > 0) {
      discountPercent =
        discountPercent - updatedInvoice.discountAmount / totalInvoices;
    }
    totalInvoices -= updatedInvoice.discountAmount;

    //const invoiceAccountItem = await this.accountItemService.findOne(updatedInvoice.account);

    if (updatedInvoice.currency) {
      //get latest currency
      const theCurrency = await this.currenciesService.findOne(
        updatedInvoice.currency,
      );
      if (theCurrency && theCurrency.currencyRate) {
        for (let i = 0; i < theCurrency.currencyRate.length; i++) {
          if (theCurrency.currencyRate[i].type == typeOfCurrency.Purchase) {
            currencyRate = 1 / theCurrency.currencyRate[i].rate;
            break;
          }
        }
      }
    }
    //calc due date
    let dueDate = moment(updatedInvoice.invoiceDate).toISOString();
    if (updatedInvoice.paymentTerm && updatedInvoice.invoiceDate) {
      //get the pyament term
      const terms = await this.paymentTermsService.findOne(
        updatedInvoice.paymentTerm,
      );
      if (terms) {
        const invDate = moment(updatedInvoice.invoiceDate);
        invDate.add(terms.days, 'days');
        dueDate = invDate.toISOString();
      }
    }

    console.log(updatedInvoice.exportLocal);
    if (updatedInvoice.exportLocal == 'local') {
      taxResult = await this.taxesService.findByName('localpurchase');
      // console.log('taxR',taxResult)
      if (taxResult) {
        taxAmt = (updatedInvoice.gst / 100) * totalInvoices;
      }
    }
    else if(updatedInvoice.exportLocal == "manual" && updatedInvoice.gstAmount > 0){
      taxResult = await this.taxesService.findByName('localpurchase');
      taxAmt = updatedInvoice.gstAmount;
    }

    const firstLine = {
      reference: updatedInvoice.invoiceNumber,
      name: updatedInvoice.invoiceNumber,
      partner: updatedInvoice.suppName,
      account: updatedInvoice.account,
      dueDate: dueDate,
      debit: 0,
      credit: (totalInvoices + taxAmt) * currencyRate,
      amountCurrency: totalInvoices + taxAmt,
      currency: updatedInvoice.currency,
      taxAmount: 0,
      reconcile: '',
      partialReconcile: '',
    };
    journalItems.push(firstLine);

    updatedInvoice.salesOrderItems.map(async (item) => {
      //const saleOrderItemInvoice =await this.accountItemService.findOneWithName(item.account);
      //  console.log('ds',saleOrderItemInvoice)
      const productItem = {
        reference: updatedInvoice.invoiceNumber,
        name: item.description,
        partner: updatedInvoice.suppName,
        account: item.account,
        dueDate: dueDate,
        debit: item.extPrice * currencyRate * discountPercent,
        credit: 0,
        amountCurrency: item.extPrice * discountPercent,
        currency: updatedInvoice.currency,
        taxAmount: 0,
        reconcile: '',
        partialReconcile: '',
      };

      journalItems.push(productItem);
    });

    if (updatedInvoice.exportLocal == 'local')  {
      //const taxResult = await this.taxesService.findByName("localpurchase");
      // console.log('taxR',taxResult)
      if (taxResult) {
        const taxItem = {
          reference: updatedInvoice.invoiceNumber,
          name: 'Tax',
          partner: updatedInvoice.suppName,
          account: taxResult.account,
          dueDate: dueDate,
          debit: taxAmt * currencyRate,
          credit: 0,
          amountCurrency: taxAmt,
          currency: updatedInvoice.currency,
          taxAmount: taxResult.rate,
          reconcile: '',
          partialReconcile: '',
        };
        journalItems.push(taxItem);
        totalInvoices += taxAmt;
      }
    }
    else if(updatedInvoice.exportLocal == "manual"){
      if(updatedInvoice.gstAmount > 0){
        const taxItem = {
          reference: updatedInvoice.invoiceNumber,
          name: 'Tax',
          partner: updatedInvoice.suppName,
          account: taxResult.account,
          dueDate: dueDate,
          debit: taxAmt * currencyRate,
          credit: 0,
          amountCurrency: taxAmt,
          currency: updatedInvoice.currency,
          taxAmount: taxResult.rate,
          reconcile: '',
          partialReconcile: '',
        };
        journalItems.push(taxItem);
        totalInvoices += taxAmt;
      }
    }

    const journalData = {
      status: 'draft',
      journalEntryNum: '',
      remarks: updatedInvoice.remarks,
      reference: updatedInvoice.soNumber,
      toReview: false,
      totalCredit: totalInvoices * currencyRate,
      totalDebit: totalInvoices * currencyRate,
      journalValue: updatedInvoice.journal ? updatedInvoice.journal : '',
      journalItems: journalItems ? journalItems : [],
      entryDate: updatedInvoice.invoiceDate,
      modelId: updatedInvoice._id,
      modelName: 'SupplierInvoice',
    };
    const findOneJournal = await this.journalEntryService.findOneWithModelId(
      updatedInvoice._id,
    );
    if (!findOneJournal) {
      await this.journalEntryService.create(journalData);
    } else {
      await this.journalEntryService.update(findOneJournal._id, journalData);
    }
  }
}
