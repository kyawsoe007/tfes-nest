import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { Model } from 'mongoose'; //added
import { Supplier } from './supplier.interface'; //added
import { InjectModel } from '@nestjs/mongoose'; //added
import { Incoterm } from 'src/incoterm/incoterm.interface';
import { GstReq } from 'src/gst-req/gst-req.interface';
import { Currency } from 'src/currencies/currencies.interface';
import { DownPayment } from 'src/down-payment/down-payment.interface';
import { SequenceSettingsService } from 'src/sequence-settings/sequence-settings.service';
import { Country } from './../countries/countries.interface';
import { PartnersService } from '../partners/partners.service';
import {
  CreatePartnerDto,
  PartnerTypeEnumDto,
} from '../partners/dto/create-partner.dto';
import { CurrenciesService } from 'src/currencies/currencies.service';

@Injectable()
export class SupplierService {
  constructor(
    @InjectModel('Supplier') private readonly supplierModel: Model<Supplier>,
    @InjectModel('Incoterm') private readonly incotermModel: Model<Incoterm>,
    @InjectModel('GstReq') private readonly gstreqModel: Model<GstReq>,
    @InjectModel('DownPayment')
    private readonly downpaymentModel: Model<DownPayment>,
    @InjectModel('Country')
    private readonly countryModel: Model<Country>,
    private readonly sequenceSettingsService: SequenceSettingsService,
    private readonly partnersService: PartnersService,
    private readonly currencyService: CurrenciesService,
  ) {}

  async create(createSupplierDto: CreateSupplierDto): Promise<Supplier> {
    const modelName = 'Supplier';
    const settingsFound = await this.sequenceSettingsService.FindSequenceByModelName(
      modelName,
    );

    const newSuppNo = this.sequenceSettingsService.sequenceSettingEx(
      settingsFound,
    );
    createSupplierDto.suppId = newSuppNo;

    if (!createSupplierDto.name) {
      throw new BadRequestException('Kindly insert supplier name');
    }

    const supp = new this.supplierModel(createSupplierDto);

    await this.sequenceSettingsService.updateSequenceByModelName(
      modelName,
      settingsFound,
    );

    const newSupp = await supp.save();

    // Create Partner
    if (newSupp) {
      const createPartnerDto: CreatePartnerDto = {
        name: newSupp.name,
        modelRef: PartnerTypeEnumDto.Supplier,
        modelId: newSupp._id,
      };

      await this.partnersService.create(createPartnerDto);
    }

    return newSupp;
  }

  async findAll(query: any): Promise<any> {
    const limit = parseInt(query.limit ? query.limit : 0);
    const skip = parseInt(query.skip ? query.skip : 0);
    const filter = query.filter ? query.filter : [];
    const searchText = query.searchText ? query.searchText : '';
    const orderBy = query.orderBy ? query.orderBy : '';

    let where = {};

    const namedFilter = [];
    if (filter != null) {
    }
    if (namedFilter.length > 0) {
      where = { and: namedFilter };
    }

    if (searchText && searchText != '') {
      const searchPattern = new RegExp('.*' + searchText + '.*', 'i');
      const searchFilter = {
        $or: [
          { name: searchPattern },
          { suppId: searchPattern },
          { nickname: searchPattern },
          { address: searchPattern },
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

    const suppliers = await this.supplierModel
      .find(where)
      .skip(skip)
      .limit(limit)
      .sort(orderBy)
      .populate(['incoterm', 'downPayment', 'gstReq', 'billingCurrent']);

    const count = await this.supplierModel.countDocuments(where);
    return [suppliers, count];
  }
  async findOne(id: string): Promise<Supplier> {
    return await this.supplierModel
      .findOne({ _id: id })
      .populate(['incoterm', 'downPayment', 'gstReq', 'billingCurrent']);
  }

  async findBySupplierNo(suppNo: string): Promise<Supplier> {
    return await this.supplierModel.findOne({ suppId: suppNo });
  }

  async update(
    id: string,
    updateSupplierDto: UpdateSupplierDto,
  ): Promise<Supplier> {
    const existingProduct = await this.supplierModel.findByIdAndUpdate(
      { _id: id },
      updateSupplierDto,
      { new: true },
    );
    await existingProduct.save();
    return existingProduct;
  }

  async remove(id: string): Promise<any> {
    const response = await this.supplierModel.findByIdAndRemove({ _id: id });
    this.partnersService.removeType('Supplier', id);
    return response;
  }

  async productDetails(): Promise<any> {
    // const tfesProductPIC = await Supplier.app.models.BaseUser.find();
    const incoterm = await this.incotermModel.find().sort({ name: 1 });
    const downPayment = await this.downpaymentModel.find().sort({ amount: 1 });
    const billCurrency = await this.currencyService.findAll();
    const gstReq = await this.gstreqModel.find();
    const country = await this.countryModel.find().sort({ name: 1 });
    // const billingAdd = await Supplier.app.models.BillingAddress.find();
    // const delAddress = await Supplier.app.models.DelAddress.find();
    return {
      // tfesProductPIC: tfesProductPIC ? tfesProductPIC : [],
      incoterm: incoterm ? incoterm : [],
      downPayment: downPayment ? downPayment : [],
      billCurrency: billCurrency ? billCurrency : [],
      gstReq: gstReq ? gstReq : [],
      country: country ? country : [],
    };
  }

  async findBySupplierIdNonPopulate(id: string): Promise<Supplier> {
    return await this.supplierModel.findById(id);
  }
}
