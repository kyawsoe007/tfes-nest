import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as moment from 'moment';
import { InjectModel } from '@nestjs/mongoose'; // Added new Line

import { Model } from 'mongoose'; // Added new line
import { SequenceSettingsService } from 'src/sequence-settings/sequence-settings.service';
import { CreateInvoiceDto, InvoiceStatusEnum } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { CurrenciesService } from 'src/currencies/currencies.service';
import { ReconcileService } from 'src/reconcile/reconcile.service';
import { IncotermService } from 'src/incoterm/incoterm.service';
import { PaymentTermsService } from 'src/payment-terms/payment-terms.service';
import { JournalEntryService } from 'src/journal-entry/journal-entry.service';
import { Invoice } from './interfaces/invoices.interface';
import { TaxesService } from 'src/taxes/taxes.service';
import { BomsService } from 'src/boms/boms.service';
import { SkusService } from 'src/skus/skus.service';
import { ProductsService } from 'src/products/products.service';
import { QuotationsService } from 'src/quotations/quotations.service';
import { DiscountsService } from 'src/discounts/discounts.service';
import { FilterDto } from 'src/shared/filter.dto';
import { WorkOrdersService } from 'src/work-orders/work-orders.service';
import { UsersService } from 'src/users/users.service';
import { Response } from 'express';
import { printPdfOptions } from '../shared/printPdfOptions';
import { AccountItemService } from 'src/account-item/account-item.service';
import { FiscalPeriodService } from 'src/fiscal-period/fiscal-period.service';
import { SalesOrdersService } from 'src/sales-orders/sales-orders.service';
import { SalesStatusEnumDto } from 'src/sales-orders/dto/create-sales-order.dto';
import { typeOfCurrency } from '../currencies/dto/create-currency.dto';

@Injectable()
// List of methods of queries to access to database with Respository
export class InvoicesService {
  // added constructor
  constructor(
    @InjectModel('Invoice')
    private readonly invoiceModel: Model<Invoice>,
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
    private readonly journalEntryService: JournalEntryService,
    private readonly accountItemService: AccountItemService,
    private readonly fiscalPeriodService: FiscalPeriodService,
    @Inject(forwardRef(() => SalesOrdersService))
    private readonly salesorderService: SalesOrdersService,
    private readonly usersService: UsersService,
  ) {}

  // Update latestinvoice Value to False
  async updateOldVersion(id: string) {
    const updatedData = await this.invoiceModel.findByIdAndUpdate(id, {
      new: true,
    });
    return updatedData;
  }

  // Create New Version of invoice
  async createNewVersion(originalInvoice: Invoice) {
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
      custNo: originalInvoice.custNo,
      custId: originalInvoice.custId,
      custName: originalInvoice.custName,
      soNumber: originalInvoice.soNumber,
      invoiceDate: originalInvoice.invoiceDate,
      invoiceNumber: originalInvoice.invoiceNumber,
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
      grandTotal: originalInvoice.grandTotal,
      gst: originalInvoice.gst,
      downPayment: originalInvoice.downPayment,
      remarks: originalInvoice.remarks,
      salesOrderItems: originalInvoice.salesOrderItems,
      exportLocal: originalInvoice.exportLocal,
    };
    // console.log('new',newInvoice)
    const createdNewversion = await this.invoiceModel.create(newInvoice);

    return this.findOne(createdNewversion._id);
  }

  // Create New invoice
  async createNewInvoice(createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    const keys = Object.keys(createInvoiceDto);
    keys.forEach((key) => {
      if (createInvoiceDto[key] == '') {
        delete createInvoiceDto[key];
      }
    });

    const newInvoice = new this.invoiceModel(createInvoiceDto);
    // console.log('create',newInvoice)
    const createdInvoice = await newInvoice.save();
    if (createInvoiceDto.soNumber && createInvoiceDto.soNumber != '') {
      try {
          const saleOrder=await this.salesorderService.findSaleOrderWithSoNumber(createInvoiceDto.soNumber)
        if(createInvoiceDto.total<saleOrder.total){
          let totalInvoice=await this.invoiceModel.find({soNumber:createInvoiceDto.soNumber})
          let total=0;
          if(totalInvoice.length>0){
            for(const invoice of totalInvoice){
              total+=invoice.total
            }
          }
        console.log("updating SO", createInvoiceDto.soNumber);
        if(total>=saleOrder.total){
          this.salesorderService.updateInvoiceStatus(
            saleOrder._id,
            SalesStatusEnumDto.INVOICED,
          );
          }

          if (total >= saleOrder.total) {
            this.salesorderService.updateInvoiceStatus(
              saleOrder._id,
              SalesStatusEnumDto.INVOICED,
            );
          } else {
            this.salesorderService.updateInvoiceStatus(
              saleOrder._id,
              SalesStatusEnumDto.PARTIALINVOICED,
            );
          }
        }
        else {
          this.salesorderService.updateInvoiceStatus(
            saleOrder._id,
            SalesStatusEnumDto.INVOICED,
          );
        }
      
    }
      catch(error){
        console.log("so not found");
      }
    }

    return this.findOne(createdInvoice._id);
  }

  // Find All invoices without Filter
  async findAll(): Promise<Invoice[]> {
    const response = await this.invoiceModel.find().exec();
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

              namedFilter.push({ status: { $in: soStatusArray } });
            } else {
              // if not in Array
              namedFilter.push({ status: propVal });
            }
          }
        } else if (property === 'grandTotal') {
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
          { custName: searchPattern }, // Customer name
          { soNumber: searchPattern }, // soMumber
          { custNo: searchPattern }, // customer number
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

    const invoices = await this.invoiceModel
      .find(where)
      .skip(skip)
      .limit(limit)
      .sort(orderBy)
      .populate(['currency', 'paymentTerm']);
    if (invoices.length > 0) {
      for (const invoice of invoices) {
        const recon = await this.reconcileService.getReconcileBalance(
          invoice._id,
        );
        invoice.set('balance', recon * -1, { strict: false });
      }
    }
    const count = await this.invoiceModel.countDocuments(where);
    return [invoices, count];
  }

  // Simple Find Invoice by Id
  async findStatusById(id: string): Promise<Invoice> {
    return await this.invoiceModel.findOne({ _id: id }).exec();
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
  async findOne(id: string): Promise<Invoice> {
    const response = await this.invoiceModel
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

    const recon = await this.reconcileService.getReconcileBalance(response._id);
    response.set('balance', recon, { strict: false });

    if (!response) {
      throw new InternalServerErrorException(`This invoice doesn't exist`);
    }

    return response;
  }

  // Update single invoice by Id
  async update(id: string, updateInvoiceDto: UpdateInvoiceDto) {
    const modelName = 'Invoice'; // hard-coded first
    const salesOrderFound = await this.invoiceModel.findOne({ _id: id }).exec();

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
      updateInvoiceDto.status === InvoiceStatusEnum.CONFIRMED &&
      updateInvoiceDto.status !== status
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
      const settingsFound = await this.sequenceSettingsService.FindSequenceByModelName(
        modelName,
      );
      if (!settingsFound) {
        throw new InternalServerErrorException('Model name does not exist!');
      }

      //check that all account items are set
      if (!updateInvoiceDto.account) {
        throw new BadRequestException('Account must be set to confirm invoice');
      }

      for (let i = 0; i < updateInvoiceDto.salesOrderItems.length; i++) {
        if (!updateInvoiceDto.salesOrderItems[i].account) {
          throw new BadRequestException(
            'Account must be set to confirm invoice',
          );
        }
      }

      updateInvoiceDto.status = InvoiceStatusEnum.UNPAID;

      // Generate pattern
      if (!invoiceNumber) {
        const newSequenceValue = this.sequenceSettingsService.sequenceSettingEx(
          settingsFound,
        );

        updateInvoiceDto.invoiceNumber = newSequenceValue;

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

      //Reconcile
      const findReconcileOne = await this.reconcileService.findOneReconcile(id);
      if (!findReconcileOne) {
        const reconcileData = {
          modelName: 'invoice',
          modelId: id,
          invoiceNumber: updateInvoiceDto.invoiceNumber,
          custId: updateInvoiceDto.custId,
          credit: 0,
          debit: updateInvoiceDto.grandTotal,
          reconciled: false,
          reconcileId: undefined,
          id: undefined,
          allocation: 0,
          origin: true,
        };

        this.reconcileService.createNewReconcile(reconcileData);
        console.log('create new reconcile');
      } else {
        findReconcileOne.custId = updateInvoiceDto.custId;
        (findReconcileOne.invoiceNumber = updateInvoiceDto.invoiceNumber),
          (findReconcileOne.debit = updateInvoiceDto.grandTotal);
        await this.reconcileService.updateReconcileInvoice(
          id,
          findReconcileOne,
        );
      }
      //}
    }

    if (updateInvoiceDto.currency) {
      const currency = await this.currenciesService.findOne(
        updateInvoiceDto.currency,
      );
      for (let i = 0; i < currency.currencyRate.length; i++) {
        if (currency.currencyRate[i].type == typeOfCurrency.Sale) {
          if (currency.currencyRate[i].rate > 0) {
            updateInvoiceDto.currencyRate = currency.latestRate;
            break;
          }
        }
      }
    }

    /*
    const keys = Object.keys(updateInvoiceDto);
    keys.forEach((key) => {
      if (updateInvoiceDto[key] == '') {
        delete updateInvoiceDto[key];
      }
    });
    */

    const updatedInvoice = await this.invoiceModel.findByIdAndUpdate(
      { _id: id },
      updateInvoiceDto,
      { new: true },
    );

    //update saleOrderStatus
    if (updatedInvoice.soNumber && updatedInvoice.soNumber != '') {
      try {
        const saleOrder = await this.salesorderService.findSaleOrderWithSoNumber(
          updatedInvoice.soNumber,
        );
        if (updatedInvoice.total < saleOrder.total) {
          const totalInvoice = await this.invoiceModel.find({
            soNumber: updatedInvoice.soNumber,
          });
          let total = 0;
          if (totalInvoice.length > 0) {
            for (const invoice of totalInvoice) {
              total += invoice.total;
            }
          }

          if (total >= saleOrder.total) {
            this.salesorderService.updateInvoiceStatus(
              saleOrder._id,
              SalesStatusEnumDto.INVOICED,
            );
          } else {
            this.salesorderService.updateInvoiceStatus(
              saleOrder._id,
              SalesStatusEnumDto.PARTIALINVOICED,
            );
          }
          }
          else {
            this.salesorderService.updateInvoiceStatus(
              saleOrder._id,
              SalesStatusEnumDto.INVOICED,
            );
          }
      
    }
      
      catch(error){
        console.log("SO not found");
      }
    }

    if (!updatedInvoice) {
      throw new InternalServerErrorException('invoice failed to update!');
    }

    // if (updateInvoiceDto.status === 'confirmed' && updateInvoiceDto.status !== status) {
    //   console.log('DATA1')
    //   this.createJournalEntry(updatedInvoice);
    // }
    if (updateInvoiceDto.status === InvoiceStatusEnum.UNPAID) {
      // console.log('DATA2')
      this.createJournalEntry(updatedInvoice);
    }
    const result = await this.findOne(id);

    return result;
  }

  // Delete Invoice by Id
  async removeOne(id: string) {
    // find sales oder by ID
    const invoiceFound = await this.invoiceModel.findOne({ _id: id }).exec();

    if (!invoiceFound) {
      throw new InternalServerErrorException(`This invoice doesn't exist`);
    }

    const { status } = invoiceFound;
    // if status is not confirmed, Proceed to Delete
    if (status == InvoiceStatusEnum.DRAFT) {
      // Remove Bom Document
      invoiceFound.salesOrderItems.forEach(async (item: { bom: string }) => {
        if (item.bom) {
          await this.bomsService.remove(item.bom);
        }
      });

      // Remove SalesOrder Document
      const deletedSalesOrder = await this.invoiceModel.findByIdAndRemove({
        _id: id,
      });
      return deletedSalesOrder;
    }
    throw new ForbiddenException(
      `This invoice has been confirmed. Deletion is forbidden`,
    );
  }

  async getInvoice(id: string): Promise<Invoice> {
    const response = await this.invoiceModel.findOne(
      { _id: id },
      'soNumber custName custId delAddress',
    );
    if (!response) {
      throw new NotFoundException('invoice not found!');
    }
    return response;
  }

  async findInvoice(id: string): Promise<Invoice> {
    return this.invoiceModel.findOne({ _id: id });
  }

  async updateStatus(id: string, status: string): Promise<any> {
    return this.invoiceModel.findByIdAndUpdate(
      id,
      { status: status },
      { new: true },
    );
  }

  async getProfomaInvoicePdf(id: string) {
    const modelName = 'ProformaInvoice'; // hard-coded first

    const invoice = await this.invoiceModel.findById(id);

    if (!invoice) {
      throw new NotFoundException('invoice not found!');
    }

    let newProInvNum = null;
    // generate proforma invoice if it doesn't exist
    if (!invoice.proInvNum) {
      const settings = await this.sequenceSettingsService.FindSequenceByModelName(
        modelName,
      );

      // Generate pattern
      newProInvNum = this.sequenceSettingsService.sequenceSettingEx(settings);

      // To update property of SoNumber
      invoice.proInvNum = newProInvNum;

      // If nextNumber exist, update new Sequence number into dbase
      await this.sequenceSettingsService.updateSequenceByModelName(
        modelName,
        settings,
      );

      // Save new ProInvNum
      await invoice.save();
    }

    /*

    if (invoice && invoice.salesOrderItems) {
      for (let i = 0; i < invoice.salesOrderItems.length; i++) {
        if (invoice.salesOrderItems[i].bom) {
          const bomList = [];
          const bomObj = await this.bomsService.findOne(
            invoice.salesOrderItems[i].bom,
          );
          for (let j = 0; j < bomObj.productList.length; j++) {
            const skuObj = await this.skusService.findOneSku(
              bomObj.productList[j].sku,
            );
            const productObj = await this.productsService.findOne(
              skuObj.product,
            );
            bomList.push({
              skuData: skuObj,
              productData: productObj,
            });
          }
          invoice.salesOrderItems[i].bomList = bomList;
        }
      }
    }
    */
    const paymentTerm = await this.paymentTermsService.findOne(
      invoice.paymentTerm,
    );
    const currency = await this.currenciesService.findOne(invoice.currency);

    const invoiceDate = moment(invoice.invoiceDate).format('Do MMMM YYYY');

    const invoicePayload = {
      custNo: invoice.custNo,
      soNumber: invoice.soNumber,
      custName: invoice.custName,
      address: invoice.address,
      telNo: invoice.telNo,
      faxNo: invoice.faxNo,
      buyerName: invoice.buyerName,
      buyerEmail: invoice.buyerEmail,
      delAddress: invoice.delAddress,
      remarks: invoice.remarks,
      paymentAddress: invoice.paymentAddress,
      status: invoice.status,
      paymentTerm: paymentTerm ? paymentTerm.name : '', // pop
      currency: currency ? currency.name : '', // pop
      currencySymbol: currency ? currency.currencySymbol : '', // pop
      symbol: currency ? currency.symbol : '', // pop
      discount: invoice.discount,
      total: invoice.total,
      gst: invoice.gst,
      // balance: invoice.total - invoice.downPayment,
      salesOrderItems: invoice.salesOrderItems,
      proInvNum: invoice.proInvNum,
      invoiceDate: invoiceDate,
    };

    return invoicePayload;
  }

  async getTaxInvoicePdf(id: string) {
    const modelName = 'TaxInvoice'; // hard-coded first

    const invoice = await this.invoiceModel.findById(id);
    //console.log(invoice);

    if (!invoice) {
      throw new NotFoundException('invoice not found!');
    }

    const newTaxInvoiceNum = null;
    // generate tax invoice if it doesn't exist
    if (!invoice.taxInvNum) {
      /*
      const settings = await this.sequenceSettingsService.FindSequenceByModelName(
        modelName,
      );

      // Generate pattern
      newTaxInvoiceNum = this.sequenceSettingsService.sequenceSettingEx(
        settings,
      );

      // If nextNumber exist, update new Sequence number into dbase
      await this.sequenceSettingsService.updateSequenceByModelName(
        modelName,
        settings,
      );
        */
      // To update property of SoNumber
      invoice.taxInvNum = invoice.invoiceNumber;

      // Save new ProInvNum
      //await invoice.save();
    }

    const paymentTerm = await this.paymentTermsService.findOne(
      invoice.paymentTerm,
    );
    const currency = await this.currenciesService.findOne(invoice.currency);

    const invoiceDate = moment(invoice.invoiceDate).format('Do MMMM YYYY');

    let deliveryRemark = '';
    let custPoNum = '';
    let salesPicFirstname = '';
    let salesPicLastName = '';
    if (invoice.soNumber) {
      const saleOrder = await this.salesorderService.findByName(
        invoice.soNumber,
      );
      if (saleOrder) {
        deliveryRemark = saleOrder.deliveryRemark;
        custPoNum = saleOrder.custPoNum;
        if (saleOrder.salesPic) {
          const salesPic = await this.usersService.findOnePic(
            saleOrder.salesPic,
          );
          salesPicFirstname = salesPic.firstName;
          salesPicLastName = salesPic.lastName;
        }
      }
    }
    let gstAmt = 0;

    let total = invoice.total;
    let discountName = '';
    if (invoice.discount) {
      const disct = await this.discountsService.findOne(invoice.discount);
      discountName = disct.name;
      if (invoice.discountAmount > 0) {
        total = total - invoice.discountAmount;
      }
    }
    if (invoice.gst > 0) {
      gstAmt = Math.round(total * invoice.gst) / 100;
    }

    const invoicePayload = {
      custNo: invoice.custNo,
      soNumber: invoice.soNumber,
      custName: invoice.custName,
      address: invoice.address,
      telNo: invoice.telNo,
      faxNo: invoice.faxNo,
      buyerName: invoice.buyerName,
      buyerEmail: invoice.buyerEmail,
      delAddress: invoice.delAddress,
      remarks: invoice.remarks,
      paymentAddress: invoice.paymentAddress,
      status: invoice.status,
      paymentTerm: paymentTerm ? paymentTerm.name : '', // pop
      currency: currency ? currency.name : '', // pop
      currencySymbol: currency ? currency.currencySymbol : '', // pop
      symbol: currency ? currency.symbol : '', // pop
      total: total,
      grandTotal: invoice.grandTotal,
      gst: invoice.gst,
      gstAmt: gstAmt,
      discountAmt: invoice.discountAmount,
      discountName: discountName,
      // balance: invoice.total - invoice.downPayment,
      salesOrderItems: invoice.salesOrderItems,
      taxInvNum: invoice.invoiceNumber,
      invoiceDate: invoiceDate,
      deliveryRemark: deliveryRemark,
      custPoNum: custPoNum,
      salesPicLastName: salesPicLastName,
      salesPicFirstname: salesPicFirstname,
    };
    return invoicePayload;
  }

  async getCommercialInvoicePdf(id: string) {
    const invoice = await this.invoiceModel.findById(id);

    if (!invoice) {
      throw new NotFoundException('invoice not found!');
    }

    if (invoice && invoice.salesOrderItems) {
      for (let i = 0; i < invoice.salesOrderItems.length; i++) {
        if (invoice.salesOrderItems[i].bom) {
          const bomList = [];
          const bomObj = await this.bomsService.findOne(
            invoice.salesOrderItems[i].bom,
          );
          for (let j = 0; j < bomObj.productList.length; j++) {
            const skuObj = await this.skusService.findOneSku(
              bomObj.productList[j].sku,
            );
            const productObj = await this.productsService.findOne(
              skuObj.product,
            );
            bomList.push({
              skuData: skuObj,
              productData: productObj,
            });
          }
          invoice.salesOrderItems[i].bomList = bomList;
        }
      }
    }
    const paymentTerm = await this.paymentTermsService.findOne(
      invoice.paymentTerm,
    );
    const currency = await this.currenciesService.findOne(invoice.currency);

    const invoiceDate = moment(invoice.invoiceDate).format('Do MMMM YYYY');

    const invoicePayload = {
      custNo: invoice.custNo,
      soNumber: invoice.soNumber,
      custName: invoice.custName,
      address: invoice.address,
      telNo: invoice.telNo,
      faxNo: invoice.faxNo,
      buyerName: invoice.buyerName,
      buyerEmail: invoice.buyerEmail,
      delAddress: invoice.delAddress,
      remarks: invoice.remarks,
      paymentAddress: invoice.paymentAddress,
      status: invoice.status,
      paymentTerm: paymentTerm ? paymentTerm.name : '', // pop
      currency: currency ? currency.name : '', // pop
      currencySymbol: currency ? currency.currencySymbol : '', // pop
      symbol: currency ? currency.symbol : '', // pop
      total: invoice.total,
      gst: invoice.gst,
      // balance: invoice.total - invoice.downPayment,
      salesOrderItems: invoice.salesOrderItems,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoiceDate,
    };

    return invoicePayload;
  }

  async createJournalEntry(updatedInvoice: any) {
    const journalItems = [];
    let totalInvoices = 0;
    let currencyRate = 1;
    let taxAmt = 0;
    let taxResult;

    //const invoiceAccountItem = await this.accountItemService.findOne(updatedInvoice.account);
    if (updatedInvoice.currency) {
      //get latest currency
      const theCurrency = await this.currenciesService.findOne(
        updatedInvoice.currency,
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

    updatedInvoice.salesOrderItems.map((item) => {
      totalInvoices += item.extPrice;
    });
    let discountPercent = 1;
    if (updatedInvoice.discountAmount > 0) {
      discountPercent =
        discountPercent - updatedInvoice.discountAmount / totalInvoices;
      totalInvoices -= updatedInvoice.discountAmount;
    }

    //calc due date
    let dueDate = '';
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
    if (updatedInvoice.exportLocal == 'local') {
      taxResult = await this.taxesService.findByName('local');
      // console.log('taxR',taxResult)
      if (taxResult) {
        taxAmt = (updatedInvoice.gst / 100) * totalInvoices;
      }
    }

    const firstLine = {
      reference: updatedInvoice.invoiceNumber,
      name: updatedInvoice.invoiceNumber,
      partner: updatedInvoice.custName,
      partner_id: updatedInvoice.custId,
      account: updatedInvoice.account,
      dueDate: dueDate,
      debit: (totalInvoices + taxAmt) * currencyRate * discountPercent,
      credit: 0,
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
        partner: updatedInvoice.custName,
        partner_id: updatedInvoice.custId,
        account: item.account,
        dueDate: dueDate,
        debit: 0,
        credit: item.extPrice * currencyRate * discountPercent,
        amountCurrency: item.extPrice,
        currency: updatedInvoice.currency,
        taxAmount: 0,
        reconcile: '',
        partialReconcile: '',
      };
      journalItems.push(productItem);
    });

    if (updatedInvoice.exportLocal == 'local') {
      // console.log('taxR',taxResult)
      if (taxResult) {
        const taxItem = {
          reference: updatedInvoice.invoiceNumber,
          name: 'Tax',
          partner: updatedInvoice.custName,
          partner_id: updatedInvoice.custId,
          account: taxResult.account,
          dueDate: dueDate,
          debit: 0,
          credit: taxAmt * currencyRate,
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
      modelName: 'Invoice',
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

  async getCsvInvoice(query: any): Promise<any> {
    const startDate = query.startDate ? query.startDate : '';
    const endDate = query.endDate ? query.endDate : '';
    const array = [];
    if (startDate && endDate) {
      var getInvoice = await this.invoiceModel
        .find({
          invoiceDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        })
        .sort({ soNumber: 1 });
    } else if (startDate && !endDate) {
      var getInvoice = await this.invoiceModel
        .find({ invoiceDate: { $gte: new Date(startDate) } })
        .sort({ soNumber: 1 });
    } else if (!startDate && endDate) {
      var getInvoice = await this.invoiceModel
        .find({ invoiceDate: { $lte: new Date(endDate) } })
        .sort({ soNumber: 1 });
    } else {
      var getInvoice = await this.invoiceModel.find().sort({ soNumber: 1 });
    }
    await Promise.all(
      getInvoice.map(async (type) => {
        if (type.currency) {
          var currency = await this.currenciesService.findOne(type.currency);
          type.currency = currency.name;
        }
        let gp = 0;
        if (type.soNumber) {
          const saleorder = await this.salesorderService.findByName(
            type.soNumber,
          );
          gp = await this.salesorderService.calculateProfit(saleorder);
        }
        let gstAmt = 0;
        if (type.gst > 0) {
          gstAmt = Math.round(type.total * type.gst) / 100;
        }
        const data = {
          custNo: type.custNo,
          custName: type.custName,
          date: moment(type.invoiceDate).format('DD/MM/YYYY'),
          invoiceNumber: type.invoiceNumber,
          soNumber: type.soNumber,
          currency: currency && currency.name,
          gst: gstAmt,
          total: type.grandTotal,
          status: type.status,
          grossProfit: gp,
        };
        return array.push(data);
      }),
    );

    return array;
  }

  async findWithDateForYTDInvoices(): Promise<Invoice[]> {
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 4, 1);
    const endDate = new Date(currentYear + 1, 3, 31);
    // const date1 = `${moment().year()}-05-01`;
    // const date2 = `${moment().year() + 1}-04-30`;
    return await this.invoiceModel
      .find({ invoiceDate: { $gte: startDate, $lte: endDate } })
      .exec();
  }

  async onCheckingSalesOrderItemProduct(productId: string): Promise<boolean> {
    const invoices = await this.invoiceModel.find().exec();
    const product = await this.productsService.findOneProductForWO(productId);

    if (invoices && invoices.length > 0) {
      if (product) {
        for (const invoice of invoices) {
          const productFound = invoice.salesOrderItems.some(
            (item) => String(item.description) === String(product.description),
          );
          if (productFound) {
            throw new BadRequestException(
              'Product existed in invoice, deletion aborted',
            );
          }
        }
      }
    }
    return true;
  }
}
