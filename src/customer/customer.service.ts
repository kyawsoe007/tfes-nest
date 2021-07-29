import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { isValidObjectId, Model } from 'mongoose'; //added
import { Customer } from './customer.interface'; //added
import { InjectModel } from '@nestjs/mongoose'; //added
import { Incoterm } from 'src/incoterm/incoterm.interface';
import { GstReq } from 'src/gst-req/gst-req.interface';
import { DownPayment } from 'src/down-payment/down-payment.interface';
import { CreditLimit } from 'src/credit-limit/credit-limit.interface';
import { CreditTerm } from 'src/credit-term/credit-term.interface';
import { PaymentTerm } from 'src/payment-terms/interfaces/payment-terms.interface';
import { Currency } from 'src/currencies/currencies.interface';
import { SequenceSettingsService } from 'src/sequence-settings/sequence-settings.service';
import { Country } from './../countries/countries.interface';
import { UsersService } from '../users/users.service';
import { PartnersService } from '../partners/partners.service';
import {
  CreatePartnerDto,
  PartnerTypeEnumDto,
} from '../partners/dto/create-partner.dto';
import { CurrenciesService } from 'src/currencies/currencies.service';
import { User } from '../users/users.interface';

@Injectable()
export class CustomerService {
  // create(createCustomerDto: CreateCustomerDto) {
  //   return 'This action adds a new customer';
  // }
  constructor(
    @InjectModel('Customer') private readonly customerModel: Model<Customer>,
    @InjectModel('Incoterm') private readonly incotermModel: Model<Incoterm>,
    @InjectModel('GstReq') private readonly gstreqModel: Model<GstReq>,
    @InjectModel('DownPayment')
    private readonly downpaymentModel: Model<DownPayment>,
    @InjectModel('CreditLimit')
    private readonly creditlimitModel: Model<CreditLimit>,
    @InjectModel('CreditTerm')
    private readonly creditTermModel: Model<CreditTerm>,
    @InjectModel('PaymentTerm')
    private readonly paymenttermModel: Model<PaymentTerm>,
    @InjectModel('Country')
    private readonly countryModel: Model<Country>,
    private readonly sequenceSettingsService: SequenceSettingsService,
    private readonly usersService: UsersService,
    private readonly partnersService: PartnersService,
    private readonly currencyService: CurrenciesService,
  ) {}
  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const modelName = 'Customer';
    const settings = await this.sequenceSettingsService.FindSequenceByModelName(
      modelName,
    );

    const newCustNo = this.sequenceSettingsService.sequenceSettingEx(settings);
    createCustomerDto.cusNo = newCustNo;

    //update sequence number
    await this.sequenceSettingsService.updateSequenceByModelName(
      modelName,
      settings,
    );

    const keys = Object.keys(createCustomerDto);
    keys.forEach((key) => {
      if (createCustomerDto[key] == '') {
        delete createCustomerDto[key];
      }
    });

    if (!createCustomerDto.name) {
      throw new BadRequestException('kindly insert customer name');
    }

    const newCustomer = await this.customerModel.create(createCustomerDto);

    // Create Partner
    if (newCustomer) {
      const createPartnerDto: CreatePartnerDto = {
        name: newCustomer.name,
        modelId: newCustomer._id,
        modelRef: PartnerTypeEnumDto.Customer,
      };

      await this.partnersService.create(createPartnerDto);
    }

    return newCustomer;
  }

  async findAll(query: any, user: User): Promise<any> {
    const limit = parseInt(query.limit ? query.limit : 0);
    const skip = parseInt(query.skip ? query.skip : 0);
    const filter = query.filter ? query.filter : [];
    const searchText = query.searchText ? query.searchText : '';
    const orderBy = query.orderBy ? query.orderBy : '';

    let where = {};

    const namedFilter = [];

    // user this if ready for it
    if (!user.isManager) {
      namedFilter.push({
        $or: [{ salesPic: user.sub }, { salesPic: { $exists: false } }],
      });
    }

    if (filter != null) {
    }
    if (namedFilter.length > 1) {
      where = { $and: namedFilter };
    } else if (namedFilter.length == 1) {
      where = namedFilter[0];
    }

    //search match cusNo, name or nickname
    if (searchText && searchText != '') {
      const searchPattern = new RegExp('.*' + searchText + '.*', 'i');
      const searchFilter = {
        $or: [
          { name: searchPattern },
          { cusNo: searchPattern },
          { nickname: searchPattern },
          { address: searchPattern},
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

    const customers = await this.customerModel
      .find(where)
      .skip(skip)
      .limit(limit)
      .sort(orderBy)
      .populate([
        'incoterm',
        'creditLimit',
        'creditTerm',
        'downPayment',
        'billingCurrency',
        'paymentTerm',
        'gstReq',
      ]);

    const count = await this.customerModel.countDocuments(where);
    
    return [customers, count];
  }
  async findOne(id: string): Promise<Customer> {
    const response = await this.customerModel
      .findOne({ _id: id })
      .populate([
        'incoterm',
        'creditLimit',
        'creditTerm',
        'downPayment',
        'billingCurrency',
        'paymentTerm',
        'gstReq',
      ]);

    return response;
  }

  async update(
    id: string,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<Customer> {
    const customer = await this.customerModel.findByIdAndUpdate(
      { _id: id },
      updateCustomerDto,
      { new: true },
    );
    await customer.save();

    return customer;
  }

  async remove(id: string): Promise<any> {
    const response = await this.customerModel.findByIdAndRemove({ _id: id });
    
    
    //remove partner
    return response;
  }

  async getAllCustomerDropdownGroup(): Promise<any> {
    // const salesPICID = await CustomerTfes.app.models.BaseUser.find();
    const incoterm = await this.incotermModel.find();
    const downPayment = await this.downpaymentModel.find();
    const creditLimit = await this.creditlimitModel.find();
    const creditTerm = await this.creditTermModel.find();
    const billingCurrency = await this.currencyService.findAll();
    const gstReq = await this.gstreqModel.find();
    const paymentTerm = await this.paymenttermModel.find();
    const country = await this.countryModel.find();
    const personIncharge = await this.usersService.findAllPic();

    return {
      // salesPICID: salesPICID ? salesPICID : [],
      incoterm: incoterm ? incoterm : [],
      downPayment: downPayment ? downPayment : [],
      billCurrency: billingCurrency ? billingCurrency : [],
      gstReq: gstReq ? gstReq : [],
      creditLimit: creditLimit ? creditLimit : [],
      creditTerm: creditTerm ? creditTerm : [],
      paymentTerm: paymentTerm ? paymentTerm : [],
      country: country ? country : [],
      personIncharge: personIncharge ? personIncharge : [],
    };
  }
}
