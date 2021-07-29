import {
  ForbiddenException,
  forwardRef,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose'; // Added new Line

import { Model } from 'mongoose'; // Added new line
import { SequenceSettingsService } from 'src/sequence-settings/sequence-settings.service';
import { CreateCreditNoteDto } from './dto/create-credit-note.dto';
import { UpdateCreditNoteDto } from './dto/update-credit-note.dto';
import { CurrenciesService } from 'src/currencies/currencies.service';
import { ReconcileService } from 'src/reconcile/reconcile.service';
import { IncotermService } from 'src/incoterm/incoterm.service';
import { PaymentTermsService } from 'src/payment-terms/payment-terms.service';
import { JournalEntryService } from 'src/journal-entry/journal-entry.service';
import { CreditNote } from './interfaces/credit-note.interface';
import { TaxesService } from 'src/taxes/taxes.service';
import { BomsService } from 'src/boms/boms.service';
import { SkusService } from 'src/skus/skus.service';
import { ProductsService } from 'src/products/products.service';
import { QuotationsService } from 'src/quotations/quotations.service';
import { DiscountsService } from 'src/discounts/discounts.service';
import { AccountItemService } from 'src/account-item/account-item.service';
import { AccountJournalService } from 'src/account-journal/account-journal.service';
import { FilterDto } from 'src/shared/filter.dto';
import { WorkOrdersService } from 'src/work-orders/work-orders.service';
import { typeOfCurrency } from 'src/currencies/dto/create-currency.dto';
import * as moment from 'moment';
import { UsersService } from 'src/users/users.service';
import { SalesOrdersService } from 'src/sales-orders/sales-orders.service';
import { InvoiceStatusEnum } from 'src/invoices/dto/create-invoice.dto';
@Injectable()
// List of methods of queries to access to database with Respository
export class CreditNoteService {
  // added constructor
  constructor(
    @InjectModel('CreditNote')
    private readonly creditNoteModel: Model<CreditNote>,
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
    private readonly accountJournalService: AccountJournalService,
    private readonly journalEntryService: JournalEntryService,
    @Inject(forwardRef(() => SalesOrdersService))
    private readonly salesOrderService: SalesOrdersService,
    private readonly usersService: UsersService,
  ) {}

  // Update latestinvoice Value to False
  async updateOldVersion(id: string) {
    const updatedData = await this.creditNoteModel.findByIdAndUpdate(id, {
      new: true,
    });
    return updatedData;
  }

  // Create New Version of invoice
  async createNewVersion(originalCreditNote: CreditNote) {
    if (originalCreditNote.salesOrderItems.length) {
      for (let i = 0; i < originalCreditNote.salesOrderItems.length; i++) {
        if (originalCreditNote.salesOrderItems[i].bom) {
          let bomList = [];
          const bomObj = await this.bomsService.findOne(
            originalCreditNote.salesOrderItems[i].bom,
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
          originalCreditNote.salesOrderItems[i].bom = createdBom._id;
        }
      }
    }

    const keys = Object.keys(originalCreditNote);
    keys.forEach((key) => {
      if (originalCreditNote[key] == '') {
        delete originalCreditNote[key];
      }
    });

    const newCreditNote = {
      createdDate: new Date(),
      custNo: originalCreditNote.custNo,
      custId: originalCreditNote.custId,
      custName: originalCreditNote.custName,
      soNumber: originalCreditNote.soNumber,
      creditNoteNumber: originalCreditNote.creditNoteNumber,
      status: originalCreditNote.status,
      address: originalCreditNote.address,
      telNo: originalCreditNote.telNo,
      faxNo: originalCreditNote.faxNo,
      buyerName: originalCreditNote.buyerName,
      buyerEmail: originalCreditNote.buyerEmail,
      delAddress: originalCreditNote.delAddress,
      paymentAddress: originalCreditNote.paymentAddress,
      paymentTerm: originalCreditNote.paymentTerm,
      currency: originalCreditNote.currency,
      discount: originalCreditNote.discount,
      total: originalCreditNote.total,
      gst: originalCreditNote.gst,
      downPayment: originalCreditNote.downPayment,
      remarks: originalCreditNote.remarks,
      salesOrderItems: originalCreditNote.salesOrderItems,
      exportLocal: originalCreditNote.exportLocal,
    };

    const createdNewversion = await this.creditNoteModel.create(newCreditNote);

    return this.findOne(createdNewversion._id);
  }

  // Create New invoice
  async createNewCreditNote(
    createCreditNoteDto: CreateCreditNoteDto,
  ): Promise<CreditNote> {
    if (createCreditNoteDto.salesOrderItems.length) {
      for (let i = 0; i < createCreditNoteDto.salesOrderItems.length; i++) {
        if (
          createCreditNoteDto.salesOrderItems[i].BomList &&
          createCreditNoteDto.salesOrderItems[i].BomList.length > 0
        ) {
          let bomObject = {};
          let bomList = [];
          createCreditNoteDto.salesOrderItems[i].BomList.forEach(
            async (bom) => {
              bomObject = { sku: bom.productId, qty: bom.qtyTwo };
              bomList.push(bomObject);
            },
          );

          const BomResult = { productList: bomList };

          const bomObj = await this.bomsService.create(BomResult);
          bomList = [];
          createCreditNoteDto.salesOrderItems[i].bom = bomObj._id;
        }
      }
    }
    const keys = Object.keys(createCreditNoteDto);
    keys.forEach((key) => {
      if (createCreditNoteDto[key] == '') {
        delete createCreditNoteDto[key];
      }
    });

    const newCreditNote = new this.creditNoteModel(createCreditNoteDto);
    const createdCreditNote = await newCreditNote.save();

    return this.findOne(createdCreditNote._id);
  }

  // Find All invoices without Filter
  async findAll(): Promise<CreditNote[]> {
    const response = await this.creditNoteModel.find().exec();
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
              const salesOrderFound = await this.creditNoteModel.find({
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
          { creditNoteNumber: searchPattern }, // CreditNote Number
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

    const invoices = await this.creditNoteModel
      .find(where)
      .skip(skip)
      .limit(limit)
      .sort(orderBy)
      .populate(['currency', 'paymentTerm']);

    const count = await this.creditNoteModel.countDocuments(where);
    return [invoices, count];
  }

  // Simple Find CreditNote by Id
  async findStatusById(id: string): Promise<CreditNote> {
    return await this.creditNoteModel.findOne({ _id: id }).exec();
  }

  // Fetch All Quotations Group
  async findAllCreditNoteDropdownGroup() {
    const paymentTerm = await this.paymentTermsService.findAll();
    const currency = await this.currenciesService.findAll();
    const gst = await this.taxesService.findAll();
    const discount = await this.discountsService.findType('sales');
    const accountItem = await this.accountItemService.findAll();
    const accountJournal = await this.accountJournalService.findAll();

    return {
      paymentTerm: paymentTerm ? paymentTerm : [],
      gst: gst ? gst : [],
      currency: currency ? currency : [],
      discount: discount ? discount : [],
      accountItem: accountItem ? accountItem : [],
      accountJournal: accountJournal ? accountJournal : [],
    };
  }

  // Find Single CreditNote
  async findOne(id: string): Promise<CreditNote> {
    const response = await this.creditNoteModel
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
      } catch (error) {
        console.log('invalid account');
      }
    }

    if (!response) {
      throw new InternalServerErrorException(`This invoice doesn't exist`);
    }

    return response;
  }

  // Update single invoice by Id
  async update(id: string, updateCreditNoteDto: UpdateCreditNoteDto) {
    const modelName = 'CreditNote'; // hard-coded first
    const salesOrderFound = await this.creditNoteModel
      .findOne({ _id: id })
      .exec();

    if (!salesOrderFound) {
      throw new InternalServerErrorException(`This invoice doesn't exist`);
    }
    const { status, soNumber, creditNoteNumber } = salesOrderFound;

    if (status === InvoiceStatusEnum.CLOSED) {
      throw new ForbiddenException(
        `CreditNote are has been closed, Update is forbidden`,
      );
    }

    console.log('Welcome to CreditNote update');

    // If user Input is 'confirmed' and not same with status in database, proceed
    if (
      updateCreditNoteDto.status === InvoiceStatusEnum.CONFIRMED &&
      updateCreditNoteDto.status !== status
    ) {
      console.log('Let proceed to confirm this credit note');

      //if (creditNoteNumber) {
      // If has soNumber, proceed update but do not run sequence function
      /*
        console.log(
          `You have creditNoteNumber: ${creditNoteNumber}, you are copyVersion, just proceed to update, No sequence settting is executed`
        );
        */
      //} else {
      // No sequence number, proceed sequence function and save/update
      const settingsFound = await this.sequenceSettingsService.FindSequenceByModelName(
        modelName,
      );
      if (!settingsFound) {
        throw new InternalServerErrorException('Model name does not exist!');
      }

      //check that all account items are set
      if (!updateCreditNoteDto.account) {
        throw new BadRequestException('Account must be set to confirm invoice');
      }

      for (let i = 0; i < updateCreditNoteDto.salesOrderItems.length; i++) {
        if (!updateCreditNoteDto.salesOrderItems[i].account) {
          throw new BadRequestException(
            'Account must be set to confirm invoice',
          );
        }
      }

      // Generate pattern
      if (!creditNoteNumber) {
        const newSequenceValue = this.sequenceSettingsService.sequenceSettingEx(
          settingsFound,
        );

        updateCreditNoteDto.creditNoteNumber = newSequenceValue;

        // If nextNumber exist, update new Sequence number into dbase
        //const { nextNumber } = settingsFound;
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

      const reconcileData = {
        modelName: 'credit-note',
        modelId: id,
        invoiceNumber: updateCreditNoteDto.creditNoteNumber,
        custId: updateCreditNoteDto.custId,
        credit: updateCreditNoteDto.total,
        debit: 0,
        reconciled: false,
        reconcileId: undefined,
        id: undefined,
        allocation: 0,
        origin: true,
      };

      this.reconcileService.createNewReconcile(reconcileData);
    }
    /*
    } else if (
        updateCreditNoteDto.status === InvoiceStatusEnum.CLOSED &&
        updateCreditNoteDto.status !== status
    ) {
        this.reconcileService.updateReconcileClosed({ modelId: id, custId: updateCreditNoteDto.custId})
    }
    */

    const keys = Object.keys(updateCreditNoteDto);
    keys.forEach((key) => {
      if (updateCreditNoteDto[key] == '') {
        delete updateCreditNoteDto[key];
      }
    });

    const updatedCreditNote = await this.creditNoteModel.findByIdAndUpdate(
      { _id: id },
      updateCreditNoteDto,
      { new: true },
    );
    if (!updatedCreditNote) {
      throw new InternalServerErrorException('credit note failed to update!');
    }

    if (
      updateCreditNoteDto.status === InvoiceStatusEnum.CONFIRMED &&
      updateCreditNoteDto.status !== status
    ) {
      this.createJournalEntry(updatedCreditNote);
    }

    const result = await this.findOne(id);

    return result;
  }

  async getCreditNotePDF(id: string) {
    const creditNote = await this.creditNoteModel.findById(id);

    if (!creditNote) {
      throw new NotFoundException('Credit-Note not fount');
    }
    const paymentTerm = await this.paymentTermsService.findOne(
      creditNote.paymentTerm,
    );
    const currency = await this.currenciesService.findOne(creditNote.currency);
    const creditNoteDate = moment(creditNote.date).format('Do MMMM YYYY');
    let deliveryRemark = '';
    let custPoNum = '';
    let salesPicFirstname = '';
    let salesPicLastName = '';
    if (creditNote.soNumber) {
      const saleOrder = await this.salesOrderService.findByName(
        creditNote.soNumber,
      );
      deliveryRemark = saleOrder.deliveryRemark;
      custPoNum = saleOrder.custPoNum;
      if (saleOrder.salesPic) {
        const salesPic = await this.usersService.findOnePic(saleOrder.salesPic);
        salesPicFirstname = salesPic.firstName;
        salesPicLastName = salesPic.lastName;
      }
    }
    let gstAmt = 0;
    if (creditNote.gst > 0) {
      gstAmt = Math.round(creditNote.total * creditNote.gst) / 100;
    }
    let total = creditNote.total;
    const discountName = '';
    const discount = Number(creditNote.discount);
    total = total - discount;

    const creditNotePayload = {
      custNo: creditNote.custNo,
      soNumber: creditNote.soNumber,
      custName: creditNote.custName,
      address: creditNote.address,
      telNo: creditNote.telNo,
      faxNo: creditNote.faxNo,
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
      taxInvNum: creditNote.creditNoteNumber,
      creditNoteDate: creditNoteDate,
      deliveryRemark: deliveryRemark,
      custPoNum: custPoNum,
      salesPicLastName: salesPicLastName,
      salesPicFirstname: salesPicFirstname,
    };
    return creditNotePayload;
  }

  // Delete CreditNote by Id
  async removeOne(id: string) {
    // find sales oder by ID
    const invoiceFound = await this.creditNoteModel.findOne({ _id: id }).exec();

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
      const deletedSalesOrder = await this.creditNoteModel.findByIdAndRemove({
        _id: id,
      });
      return deletedSalesOrder;
    }
    throw new ForbiddenException(
      `This invoice has been confirmed. Deletion is forbidden`,
    );
  }

  async getCreditNote(id: string): Promise<CreditNote> {
    const response = await this.creditNoteModel.findOne(
      { _id: id },
      'soNumber custName custId delAddress',
    );
    if (!response) {
      throw new NotFoundException('invoice not found!');
    }
    return response;
  }

  async findCreditNote(id: string): Promise<CreditNote> {
    return this.creditNoteModel.findOne({ _id: id });
  }

  async updateStatus(id: string, status: string): Promise<any> {
    return this.creditNoteModel.findByIdAndUpdate(
      id,
      { status: status },
      { new: true },
    );
  }

  async createJournalEntry(updatedCreditNote: any) {
    const journalItems = [];
    let totalInvoices = 0;
    let currencyRate = 1;
    let taxAmt = 0;
    let taxResult;

    if (updatedCreditNote.currency) {
      //get latest currency
      const theCurrency = await this.currenciesService.findOne(
        updatedCreditNote.currency,
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

    updatedCreditNote.salesOrderItems.map((item) => {
      totalInvoices += item.extPrice;
    });
    if (updatedCreditNote.exportLocal == 'local') {
      taxResult = await this.taxesService.findByName('local');
      // console.log('taxR',taxResult)
      if (taxResult) {
        taxAmt = (updatedCreditNote.gst / 100) * totalInvoices;
      }
    }

    const firstLine = {
      reference: updatedCreditNote.creditNoteNumber,
      name: updatedCreditNote.creditNoteNumber,
      partner: updatedCreditNote.custName,
      partner_id: updatedCreditNote.custId,
      account: updatedCreditNote.account,
      dueDate: updatedCreditNote.date ? updatedCreditNote.date : '',
      debit: 0,
      credit: (totalInvoices + taxAmt) * currencyRate,
      amountCurrency: totalInvoices + taxAmt,
      currency: updatedCreditNote.currency,
      taxAmount: 0,
      reconcile: '',
      partialReconcile: '',
    };
    journalItems.push(firstLine);

    updatedCreditNote.salesOrderItems.map((item) => {
      const productItem = {
        reference: updatedCreditNote.creditNoteNumber,
        name: item.description,
        partner: updatedCreditNote.custName,
        partner_id: updatedCreditNote.custId,
        account: item.account,
        dueDate: updatedCreditNote.date ? updatedCreditNote.date : '',
        debit: item.extPrice * currencyRate,
        credit: 0,
        amountCurrency: item.extPrice,
        currency: updatedCreditNote.currency,
        taxAmount: 0,
        reconcile: '',
        partialReconcile: '',
      };

      journalItems.push(productItem);
    });

    if (updatedCreditNote.exportLocal == 'local') {
      if (taxResult) {
        const taxItem = {
          reference: updatedCreditNote.creditNoteNumber,
          name: 'Tax',
          partner: updatedCreditNote.custName,
          partner_id: updatedCreditNote.custId,
          account: taxResult.account,
          dueDate: updatedCreditNote.date ? updatedCreditNote.date : '',
          debit: taxAmt * currencyRate,
          credit: 0,
          amountCurrency: taxAmt,
          currency: '',
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
      remarks: '',
      reference: updatedCreditNote.creditNoteNumber,
      toReview: false,
      totalCredit: totalInvoices * currencyRate,
      totalDebit: totalInvoices * currencyRate,
      journalValue: updatedCreditNote.journal ? updatedCreditNote.journal : '',
      journalItems: journalItems ? journalItems : [],
      entryDate: updatedCreditNote.date,
      modelId: updatedCreditNote._id,
      modelName: 'CreditNote',
    };

    await this.journalEntryService.create(journalData);
  }
}
