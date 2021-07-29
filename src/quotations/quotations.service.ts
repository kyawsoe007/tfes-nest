import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import * as moment from 'moment';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  CreateQuotationDto,
  QuotationStatusEnumDto,
} from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { Quotation } from './quotation.interface';
import { SequenceSettingsService } from '../sequence-settings/sequence-settings.service';
import { PaymentTermsService } from '../payment-terms/payment-terms.service';
import { IncotermService } from '../incoterm/incoterm.service';
import { CurrenciesService } from '../currencies/currencies.service';
import { TaxesService } from '../taxes/taxes.service';
import { BomsService } from '../boms/boms.service';
import { SkusService } from '../skus/skus.service';
import { ProductsService } from '../products/products.service';
import { DiscountsService } from '../discounts/discounts.service';
import { FilterDto } from '../shared/filter.dto';
import { UsersService } from '../users/users.service';
import { UomService } from '../uom/uom.service';
import { PaymentTerm } from '../payment-terms/interfaces/payment-terms.interface';
import { Currency } from '../currencies/currencies.interface';
import { User } from '../users/users.interface';
import { Incoterm } from '../incoterm/incoterm.interface';
import { typeOfCurrency } from '../currencies/dto/create-currency.dto';
import orderCalculation from '../shared/orderCalculation';

@Injectable()
export class QuotationsService {
  // added constructor
  constructor(
    @InjectModel('Quotation')
    private readonly quotationModel: Model<Quotation>,
    private readonly sequenceSettingsService: SequenceSettingsService,
    private readonly paymentTermsService: PaymentTermsService,
    private readonly incotermService: IncotermService,
    private readonly currenciesService: CurrenciesService,
    private readonly taxesService: TaxesService,
    private readonly bomsService: BomsService,
    private readonly skusService: SkusService,
    private productsService: ProductsService,
    private readonly discountsService: DiscountsService,
    private readonly usersService: UsersService,
    private readonly uomService: UomService,
  ) {}

  // Create New Quotation
  async create(createQuotationDto: CreateQuotationDto) {
    console.log('createQuotationDto', createQuotationDto);
    const salesOrderItems = createQuotationDto.salesOrderItems;
    //create all the boms

    if (salesOrderItems && salesOrderItems.length > 0) {
      console.log('salesOrderItems', salesOrderItems);

      for (const quoItem of salesOrderItems) {
        if (typeof quoItem.SN !== 'number' || quoItem.SN !== quoItem.SN) {
          throw new BadRequestException('Some lines are not a number');
        }
        // quoItem.SN = incrementSN++;
        delete quoItem._id;
      }
      salesOrderItems.sort((a, b) => a.SN - b.SN);
    }

    if (createQuotationDto.currency) {
      //find purchase rate
      const currency = await this.currenciesService.findOne(
        createQuotationDto.currency,
      );
      for (let i = 0; i < currency.currencyRate.length; i++) {
        if (currency.currencyRate[i].type == typeOfCurrency.Sale) {
          if (currency.currencyRate[i].rate > 0) {
            createQuotationDto.currencyRate = currency.latestRate;
            break;
          }
        }
      }
    }

    const { discount, total, gst, isPercentage } = createQuotationDto;
    // Calculation function
    const calculation = orderCalculation(discount, isPercentage, total, gst);

    // add  specific quotation fields.
    const newQuotation = {
      createdDate: createQuotationDto.createdDate,
      salesPic: createQuotationDto.salesPic,
      custNo: createQuotationDto.custNo,
      custId: createQuotationDto.custId,
      custName: createQuotationDto.custName,
      address: createQuotationDto.address,
      telNo: createQuotationDto.telNo,
      faxNo: createQuotationDto.faxNo,
      buyerName: createQuotationDto.buyerName,
      buyerEmail: createQuotationDto.buyerEmail,
      delAddress: createQuotationDto.delAddress,
      remarks: createQuotationDto.remarks,
      paymentAddress: createQuotationDto.paymentAddress,
      incoterm: createQuotationDto.incoterm,
      paymentTerm: createQuotationDto.paymentTerm,
      currency: createQuotationDto.currency,
      discount: createQuotationDto.discount,
      total: createQuotationDto.total,
      gst: createQuotationDto.gst,
      downPayment: createQuotationDto.downPayment,
      exportLocal: createQuotationDto.exportLocal,
      salesOrderItems: salesOrderItems,
      leadTime: createQuotationDto.leadTime,
      deliveryRemark: createQuotationDto.deliveryRemark,
      custPoNum: createQuotationDto.custPoNum,
      prices: createQuotationDto.prices,
      validity: createQuotationDto.validity,
      discountAmt: calculation.discountAmt,
      subTotalAmt: calculation.subTotalAmt,
      gstAmt: calculation.gstAmt,
      currencyrate: createQuotationDto.currencyRate,
      header: createQuotationDto.header,
      box: createQuotationDto.box,
      discountName: createQuotationDto.discountName,
      workScope: createQuotationDto.workScope,
      isPercentage: createQuotationDto.isPercentage,
    };

    const creatednewQuotation = new this.quotationModel(newQuotation);
    const quote = await creatednewQuotation.save();
    return this.findOne(quote._id);
  }

  // Create New Version of Quotation
  async createNewVersionQuotation(quotation: Quotation) {
    // must be latestversion
    if (quotation.latestQuotation === false) {
      throw new BadRequestException(
        'New version has been created, request forbidden',
      );
    }

    // required confirmation
    if (!quotation.quoRef) {
      throw new BadRequestException(`Confirmation is required`);
    }

    if (quotation.salesOrderItems.length) {
    }

    const newQuotation = {
      createdDate: quotation.createdDate,
      salesPic: quotation.salesPic,
      custNo: quotation.custNo,
      custId: quotation.custId,
      custName: quotation.custName,
      address: quotation.address,
      telNo: quotation.telNo,
      faxNo: quotation.faxNo,
      buyerName: quotation.buyerName,
      buyerEmail: quotation.buyerEmail,
      quoRef: quotation.quoRef,
      delAddress: quotation.delAddress,
      remarks: quotation.remarks,
      paymentAddress: quotation.paymentAddress,
      status: quotation.status,
      latestQuotation: true,
      versionNum: quotation.versionNum + 1,
      incoterm: quotation.incoterm,
      paymentTerm: quotation.paymentTerm,
      currency: quotation.currency,
      discount: quotation.discount,
      total: quotation.total,
      gst: quotation.gst,
      downPayment: quotation.downPayment,
      initialVersion: quotation.initialVersion
        ? quotation.initialVersion
        : quotation._id,
      exportLocal: quotation.exportLocal,
      salesOrderItems: quotation.salesOrderItems,
      leadTime: quotation.leadTime,
      deliveryRemark: quotation.deliveryRemark,
      custPoNum: quotation.custPoNum,
      prices: quotation.prices,
      validity: quotation.validity,
      discountAmt: quotation.discountAmt,
      subTotalAmt: quotation.subTotalAmt,
      gstAmt: quotation.gstAmt,
      currencyRate: quotation.currencyRate,
      header: quotation.header,
      box: quotation.box,
      discountName: quotation.discountName,
      workScope: quotation.workScope,
      isPercentage: quotation.isPercentage,
    };

    const finalResult = await this.quotationModel.create(newQuotation);

    return this.findOne(finalResult._id);
  }

  // Find All Quotations
  async findAll(): Promise<Quotation[]> {
    const response = await this.quotationModel
      .find()
      .populate(['currency', 'paymentTerm', 'incoterm']);
    return response;
  }
   //file id store
   async updateFileId(id: string, file: string): Promise<Quotation> {
    //console.log('id',id)
    //console.log('file',file)
    return await this.quotationModel.findByIdAndUpdate(
      id,
      { file: file },
      { new: true },
    );
  }
  // Find with a year
  async findWithDate(): Promise<Quotation[]> {
    const date1 = `${moment().year()}-05-01`;
    const date2 = `${moment().year() + 1}-04-30`;
    // console.log('date1',date1)
    // console.log('fis',`${moment().year()}-05-01`)
    // console.log('datefis',`${moment().year()+1}-04-30`)
    return await this.quotationModel
      .find({ createdAt: { $gte: date1, $lte: date2 } })
      .exec();
  }

  //Find All + FilterDto
  async getfilters(query: FilterDto, user: User): Promise<any> {
    const limit = query.limit ? query.limit : 0;
    const skip = query.skip ? query.skip : 0;
    const filter = query.filter ? query.filter : [];
    const searchText = query.searchText ? query.searchText : '';
    const orderBy =
      query.orderBy && Object.keys(query.orderBy).length > 0
        ? query.orderBy
        : { quoRef: -1 };

    let where = {};
    let grandTotatQueryInput = {};
    const namedFilter = [];

    // User this when ready for it
    if (!user.isManager) {
      namedFilter.push({ salesPic: user.sub });
    }

    namedFilter.push({ latestQuotation: true });

    if (filter != null) {
      for (let i = 0; i < filter.length; i++) {
        const property = Object.keys(filter[i])[0];
        const propVal = Object.values(filter[i])[0];
        if (property === 'status') {
          if (propVal !== '') {
            if (Array.isArray(propVal)) {
              //if in array
              const quoStatusArray = propVal;
              const quotationsFound = await this.quotationModel.find({
                status: { $in: quoStatusArray },
              });
              // map - get each status - push each into array object
              const quoStatus = quotationsFound.map((item) => item.status);

              console.log('STATUS', quoStatus);
              namedFilter.push({ status: { $in: quoStatus } });
            } else {
              // if not in Array
              namedFilter.push({ status: propVal });
            }
          }
        } else if (property === 'total' || property === 'grandTotalAmt') {
          if (Array.isArray(propVal)) {
            if (propVal[0] === '') {
              // if min field is empty, filter (less than)
              // namedFilter.push({ total: { $lte: parseInt(propVal[1]) } });
              grandTotatQueryInput = {
                grandTotalAmt: { $lte: parseInt(propVal[1]) },
              };
            } else if (propVal[1] === '') {
              // if max field is empty, filter (greater than)
              // namedFilter.push({ total: { $gte: parseInt(propVal[0]) } });
              grandTotatQueryInput = {
                grandTotalAmt: { $gte: parseInt(propVal[0]) },
              };
            } else {
              // else filter (greater and lesser)
              grandTotatQueryInput = {
                grandTotalAmt: {
                  $gte: parseInt(propVal[0]),
                  $lte: parseInt(propVal[1]),
                },
              };
            }
          }
        } else if (property === 'updatedAt') {
          if (Array.isArray(propVal)) {
            if (propVal[0] === 0) {
              console.log(propVal[0]);
              // if Min field is empty, filter lesser
              namedFilter.push({ updatedAt: { $lte: propVal[1] } });
            } else {
              // if Min field is not empty, filter greater and lesser
              // https://stackoverflow.com/questions/55108562/why-does-eq-comparison-is-not-working-on-mongodb-with-dates
              const upperBoundDate = new Date(propVal[1]);
              upperBoundDate.setDate(upperBoundDate.getDate() + 1);
              namedFilter.push({
                updatedAt: { $gte: propVal[0], $lte: upperBoundDate },
              });
            }
          } else {
            // if Max field is empty, it is not in Array
            namedFilter.push({ updatedAt: { $gte: propVal } });
          }
        } else if (property === 'salesPic') {
          const response = await this.usersService.findAllPic();
          const searchId = [];

          if (Array.isArray(propVal)) {
            for (let i = 0; i < propVal.length; i++) {
              for (let j = 0; j < response.length; j++) {
                if (
                  `${response[j].firstName} ${response[j].lastName}` ===
                  propVal[i]
                ) {
                  searchId.push(response[j]._id);
                  // break;
                }
              }
            }
          } else {
            // for single pic filter
            for (let i = 0; i < response.length; i++) {
              if (
                `${response[i].firstName} ${response[i].lastName}` === propVal
              ) {
                searchId.push(response[i]._id);
                break;
              }
            }
          }
          namedFilter.push({ salesPic: { $in: searchId } });
        } else if (property === 'soStatus') {
          if (propVal !== '') {
            //if in array
            if (Array.isArray(propVal)) {
              namedFilter.push({ soStatus: { $in: propVal } });
            } else {
              // if not in array
              namedFilter.push({ soStatus: propVal });
            }
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
          { status: searchPattern }, // Status
          { quoRef: searchPattern }, // Quotation Ref
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

    // const quotations = await this.quotationModel
    //   .find(where)
    //   .skip(skip)
    //   .limit(limit)
    //   .sort(orderBy)
    //   .populate(['currency', 'paymentTerm', 'incoterm']);

    const quotations = await this.quotationModel.aggregate([
      { $match: where },
      { $skip: skip },
      { $limit: limit },
      { $sort: orderBy },
      {
        $project: {
          quoRef: 1,
          soStatus: 1,
          status: 1,
          currency: 1,
          custName: 1,
          versionNum: 1,
          salesPic: 1,
          updatedAt: 1,
          grandTotalAmt: { $sum: ['$subTotalAmt', '$gstAmt'] },
        },
      },
      { $match: grandTotatQueryInput },
      {
        $lookup: {
          from: 'currencies',
          localField: 'currency',
          foreignField: '_id',
          as: 'currency',
        },
      },
      {
        $unwind: '$currency',
      },
      {
        $set: {
          id: '$_id',
        },
      },
    ]);

    for (let i = 0; i < quotations.length; i++) {
      // Get individual salesPic firstName and lastName
      if (quotations[i].salesPic) {
        const salesPicId = quotations[i].salesPic;
        const salesPic = await this.usersService.findUserbyId(salesPicId);
        // quotations[i].set('salesPicFirstName', salesPic.firstName, {
        //   strict: false,
        // });

        // quotations[i].set('salesPicLastName', salesPic.lastName, {
        //   strict: false,
        // });
        quotations[i].salesPicFirstName = salesPic.firstName;
        quotations[i].salesPicLastName = salesPic.lastName;
      }

      // const grandTotalAmt = quotations[i].subTotalAmt + quotations[i].gstAmt;
      // quotations[i].set('grandTotalAmt', grandTotalAmt, {
      //   strict: false,
      // });

      // group initialVersion
      if (quotations[i].initialVersion) {
        const oldVersionFound = await this.findOldVersions(
          quotations[i].initialVersion,
        );
        quotations[i].set('oldVersionList', oldVersionFound, {
          strict: false,
        });
      }
    }

    where =
      JSON.stringify(grandTotatQueryInput) !== '{}'
        ? grandTotatQueryInput
        : where;

    const count = await this.quotationModel.countDocuments(where);
    return [quotations, count];
  }

  // Find old Versions by initialVersion Id
  async findOldVersions(initialVersionIdArg: string) {
    const response = await this.quotationModel
      .find({
        $or: [
          {
            $and: [
              { initialVersion: initialVersionIdArg },
              { latestQuotation: false },
            ],
          },
          { _id: initialVersionIdArg },
        ],
      })
      .sort({ versionNum: -1 });
    return response;
  }

  // Fetch All Quotations Group
  async getAllQuotationDropdownGroup() {
    const paymentTerm = await this.paymentTermsService.findAll();
    const incoterm = await this.incotermService.findAll();
    const currency = await this.currenciesService.findAll();
    const gst = await this.taxesService.findAll();
    const discount = await this.discountsService.findType('sales');
    const personIncharge = await this.usersService.findAllPic();
    const uom = await this.uomService.findAll();

    return {
      paymentTerm,
      incoterm,
      currency,
      gst,
      discount,
      personIncharge,
      uom,
    };
  }

  // Simple Find Quotation by Id
  async findStatusById(id: string): Promise<Quotation> {
    const statusFound = await this.quotationModel.findOne({ _id: id }).exec();

    if (statusFound && statusFound.status === QuotationStatusEnumDto.DRAFT) {
      throw new BadRequestException('Status in draft, request denied');
    }

    if (statusFound && statusFound.isConverted === true) {
      throw new BadRequestException('Quotation was converted, request denied');
    }

    return statusFound;
  }

  // Update SO details in quotation if SO opened
  async updateSoDetail(
    quotationId: string,
    soNumber: string,
    soStatus: string,
  ) {
    const quotationFound = await this.quotationModel.findById(quotationId);
    if (quotationFound && quotationFound.salesOrder) {
      return await this.quotationModel.findByIdAndUpdate(
        quotationId,
        { soNumber: soNumber, soStatus: soStatus },
        { new: true },
      );
    }
    return;
  }

  // Update isConvert:true to lock this quotation when so confirmed
  async updateConvertStatus(
    quotationId: string,
    salesOrderId: string,
    soStatus: string,
    isMode: string,
  ) {
    const quotationFound = await this.quotationModel.findById(quotationId);

    if (quotationFound) {
      if (isMode === 'onCreate') {
        if (quotationFound.isConverted === false) {
          return await this.quotationModel.findByIdAndUpdate(quotationId, {
            isConverted: true,
            salesOrder: salesOrderId,
            soStatus: soStatus,
            status: QuotationStatusEnumDto.WIN,
            // Would it change quotation status if Sales order Loss status?
          });
        }
        console.log(`This quotation was converted`);
        throw new BadRequestException(
          `This quotation was converted, request denied`,
        );
      }
      if (isMode === 'onDelete') {
        if (quotationFound.isConverted === true) {
          return await this.quotationModel.findByIdAndUpdate(quotationId, {
            isConverted: false,
            $unset: { salesOrder: '', soStatus: '' },
          });
        }
      }
    }
    quotationFound;
  }

  // Update latestQuotation value to false
  async updateQuotationStatus(id: string) {
    await this.quotationModel.findByIdAndUpdate(
      id,
      { latestQuotation: false },
      { new: true },
    );
    return this.findOne(id);
  }

  // Find Quotation by Id
  async findOne(id: string): Promise<Quotation> {
    const response = await this.quotationModel
      .findOne({ _id: id })
      .populate(['currency', 'paymentTerm', 'incoterm', 'user']);

    if (!response) {
      throw new NotFoundException(`Quotation not found`);
    }

    for (let i = 0; i < response.salesOrderItems.length; i++) {
      if (response.salesOrderItems[i].bom) {
        const bomList = [];
        const bomObj = await this.bomsService.findOne(
          response.salesOrderItems[i].bom,
        );
        for (let j = 0; j < bomObj.productList.length; j++) {
          const skuObj = await this.skusService.findOneSku(
            bomObj.productList[j].sku,
          );
          const productObj = await this.productsService.findOne(skuObj.product);
          bomList.push({
            sku: bomObj.productList[j].sku,
            qty: bomObj.productList[j].qty,
            skuData: skuObj,
            productData: productObj,
          });
        }
        response.salesOrderItems[i].set('BomList', bomList, { strict: false });
      }
    }

    return response;
  }

  // Update Quotation by Id
  async update(
    id: string,
    updateQuotationDto: UpdateQuotationDto,
  ): Promise<Quotation> {
    const modelName = 'Quotation'; // hard-coded first
    const quotationFound = await this.quotationModel
      .findOne({ _id: id })
      .exec();

    if (!quotationFound) {
      throw new NotFoundException(`Quotation not found`);
    }

    const { status, quoRef, isConverted, latestQuotation } = quotationFound;

    // if latestQuotation is True ( proceed to update mode )

    if (!latestQuotation) {
      throw new BadRequestException(`Old quotation, request denied`);
    }

    if (isConverted) {
      throw new BadRequestException(
        `Quotation has been converted. request denied`,
      );
    }

    if (status === QuotationStatusEnumDto.LOSS) {
      throw new BadRequestException(`Quotation has been loss, request denied`);
    }

    if (status === QuotationStatusEnumDto.WIN) {
      throw new BadRequestException(`Quotation has been won, request denied`);
    }

    console.log('Welcome to Quotation update');

    /*
    const salesOrderItems = updateQuotationDto.salesOrderItems.filter(
      (item) => {
        return item.sku || (item.BomList && item.BomList.length > 0);
      },
    );
*/
    const salesOrderItems = updateQuotationDto.salesOrderItems;

    if (salesOrderItems && salesOrderItems.length > 0) {
      // let incrementSN = 1;
      for (const quoItem of salesOrderItems) {
        if (typeof quoItem.SN !== 'number' || quoItem.SN !== quoItem.SN) {
          throw new BadRequestException('Some lines are not a number');
        }
        // quoItem.SN = incrementSN++;
      }
      salesOrderItems.sort((a, b) => a.SN - b.SN);

      updateQuotationDto.salesOrderItems = salesOrderItems;
    } else {
      throw new BadRequestException('Order item should not be empty');
    }

    if (updateQuotationDto.currency) {
      //find purchase rate
      const currency = await this.currenciesService.findOne(
        updateQuotationDto.currency,
      );
      for (let i = 0; i < currency.currencyRate.length; i++) {
        if (currency.currencyRate[i].type == typeOfCurrency.Sale) {
          if (currency.currencyRate[i].rate > 0) {
            updateQuotationDto.currencyRate = currency.latestRate;
            break;
          }
        }
      }
    }

    const { discount, total, gst, isPercentage } = updateQuotationDto;

    // Calculation function
    const calculation = orderCalculation(discount, isPercentage, total, gst);

    updateQuotationDto.discountAmt = calculation.discountAmt;
    updateQuotationDto.gstAmt = calculation.gstAmt;
    updateQuotationDto.subTotalAmt = calculation.subTotalAmt;

    if (
      updateQuotationDto.status === QuotationStatusEnumDto.ISSUED &&
      updateQuotationDto.status !== status
    ) {
      console.log('Let proceed to open this quotation');
      if (quoRef) {
        console.log(
          `You have quoRef: ${quoRef}, No sequence settting executed`,
        );
      } else {
        // No sequence number, proceed sequence function and save/update
        const settings = await this.sequenceSettingsService.FindSequenceByModelName(
          modelName,
        );

        // Generate pattern
        const newQuoRef = this.sequenceSettingsService.sequenceSettingEx(
          settings,
        );

        // To update property of quoRef
        updateQuotationDto.quoRef = newQuoRef;

        // If nextNumber exist, update new Sequence number into dbase
        await this.sequenceSettingsService.updateSequenceByModelName(
          modelName,
          settings,
        );
      }
    }

    const quotation = await this.quotationModel.findByIdAndUpdate(
      id,
      updateQuotationDto,
      { new: true },
    );
    if (!quotation) {
      throw new NotFoundException('Quotation not found!');
    }

    const result = await this.findOne(id);
    return result;
  }

  // Remove Single Quotation by Id
  async remove(id: string): Promise<any> {
    // find quotation by ID
    const quotationFound = await this.quotationModel
      .findOne({ _id: id })
      .exec();

    if (!quotationFound) {
      throw new NotFoundException(`Quotation not found!`);
    }

    const { isConverted, status } = quotationFound;

    if (isConverted !== true) {
      // if status is not open, Proceed to Delete
      if (status !== QuotationStatusEnumDto.WIN) {
        console.log('Let proceed to delete this quotation');

        // Remove Quotation Document
        await this.quotationModel.findByIdAndRemove(id);
        return 'Quotation successfully removed';
      }
      throw new BadRequestException(`Quotation has been won, request denied`);
    }
    // Delete quotation
    throw new BadRequestException(
      `Quotation has been converted, request denied`,
    );
  }

  async generatePdf(id: string): Promise<any> {
    const quotation = await this.quotationModel.findById(id);

    if (!quotation) {
      throw new NotFoundException('Quotation not found');
    }

    for (const quoItem of quotation.salesOrderItems) {
      const uom = await this.uomService.findOne(quoItem.uom);
      if (uom) {
        quoItem.uomName = uom.name;
      }
    }

    const createdDate = moment(quotation.createdDate).format('Do MMMM YYYY');

    let paymentTerm: PaymentTerm,
      currency: Currency,
      salesPic: User,
      incoterm: Incoterm;

    if (quotation.paymentTerm) {
      paymentTerm = await this.paymentTermsService.findOne(
        quotation.paymentTerm,
      );
    }
    if (quotation.currency) {
      currency = await this.currenciesService.findOne(quotation.currency);
    }

    if (quotation.salesPic) {
      salesPic = await this.usersService.findOnePic(quotation.salesPic);
    }

    if (quotation.incoterm) {
      incoterm = await this.incotermService.findOne(quotation.incoterm);
    }

    const grandTotalAmt = quotation.subTotalAmt + quotation.gstAmt;
    const hasDownPayment = quotation.downPayment || 0;
    const balanceAmount = grandTotalAmt - hasDownPayment;

    const newQuotation = {
      createdDate: createdDate,
      salesPicLastName: salesPic ? salesPic.lastName : undefined, // pop
      salesPicFirstName: salesPic ? salesPic.firstName : undefined, // pop
      custNo: quotation.custNo,
      custName: quotation.custName,
      address: quotation.address,
      telNo: quotation.telNo,
      faxNo: quotation.faxNo,
      buyerName: quotation.buyerName,
      buyerEmail: quotation.buyerEmail,
      quoRef: quotation.quoRef,
      delAddress: quotation.delAddress ? quotation.delAddress : '',
      remarks: quotation.remarks,
      paymentAddress: quotation.paymentAddress ? quotation.paymentAddress : '',
      status: quotation.status,
      incoterm: incoterm ? incoterm.name : undefined, //pop,
      paymentTermName: paymentTerm ? paymentTerm.name : undefined, // pop
      paymentTermDays: paymentTerm ? paymentTerm.days : undefined, // pop
      currency: currency ? currency.name : undefined, // pop
      currencyLatestRate: currency ? currency.latestRate : undefined, // pop
      currencySymbol: currency ? currency.symbol : undefined, // pop
      currencySymbol2: currency ? currency.currencySymbol : undefined, // pop
      discount: quotation.discount,
      total: quotation.total,
      gst: quotation.gst,
      downPayment: quotation.downPayment,
      balance: quotation.total - quotation.downPayment,
      exportLocal: quotation.exportLocal,
      salesOrderItems: quotation.salesOrderItems,
      leadTime: quotation.leadTime,
      deliveryRemark: quotation.deliveryRemark,
      custPoNum: quotation.custPoNum,
      prices: quotation.prices,
      validity: quotation.validity,
      discountAmt: quotation.discountAmt,
      subTotalAmt: quotation.subTotalAmt,
      gstAmt: quotation.gstAmt,
      grandTotalAmt: grandTotalAmt,
      balanceAmount: balanceAmount,
      header: quotation.header,
      box: quotation.box,
      discountName: quotation.discountName,
      workScope: quotation.workScope,
    };

    console.log('PDF', newQuotation);

    return newQuotation;
  }

  async findWithDateForYTDQuotations(): Promise<Quotation[]> {
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 4, 1);
    const endDate = new Date(currentYear + 1, 3, 31);

    // const date1 = `${moment().year()}-05-01`;
    // const date2 = `${moment().year() + 1}-04-30`;

    return await this.quotationModel
      .find({ createdDate: { $gte: startDate, $lte: endDate } })
      .exec();
  }

  async onCheckingSalesOrderItemProduct(productId: string): Promise<boolean> {
    const quotations = await this.quotationModel.find().exec();

    if (quotations && quotations.length > 0) {
      for (const quotation of quotations) {
        const productFound = quotation.salesOrderItems.some(
          (item) => String(item.productId) === String(productId),
        );
        if (productFound) {
          throw new BadRequestException(
            'Product existed in quotation, deletion aborted',
          );
        }
      }
    }
    return true;
  }
}
