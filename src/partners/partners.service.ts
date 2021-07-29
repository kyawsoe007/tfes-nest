import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { path } from 'pdfkit';
import { Customer } from 'src/customer/customer.interface';
import { Supplier } from 'src/supplier/supplier.interface';
import { SupplierService } from 'src/supplier/supplier.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { Partner } from './partners.interface';

@Injectable()
export class PartnersService {
  constructor(
    @InjectModel('Partner')
    private readonly partnerModel: Model<Partner>,
    @InjectModel('Customer')
    private readonly customerModel: Model<Customer>,
    @InjectModel('Supplier')
    private readonly supplierModel: Model<Supplier>
  ) { }

  async create(createPartnerDto: CreatePartnerDto): Promise<Partner> {
    const newPartner = new this.partnerModel(createPartnerDto);
    return await newPartner.save();
  }

  // async findAll(): Promise<Partner[]> {
  //   return await this.partnerModel.find();
  // }

  async findAll(query: any): Promise<any> {
    const limit = parseInt(query.limit ? query.limit : 0);
    const skip = parseInt(query.skip ? query.skip : 0);
    const filter = query.filter ? query.filter : [];
    const searchText = query.searchText ? query.searchText : '';
    const orderBy = query.orderBy ? query.orderBy : '';

    let where = {};

    const namedFilter = [];
    if (filter != null) {
      for (let i = 0; i < filter.length; i++) {
        const property = Object.keys(filter[i])[0];
        const propVal = Object.values(filter[i])[0];
        if (property === 'modelRef') {
          if (propVal !== '') {
            if (Array.isArray(propVal)) {
              namedFilter.push({ modelRef: { $in: propVal }})
            } else {
              namedFilter.push({ modelRef: propVal })
            }
          }
        }

      }
      //filter by modelRef
    }
    // if (namedFilter.length > 0) {
    //   where = { and: namedFilter };
    // }

    if (namedFilter.length === 1) {
      where = namedFilter[0];
    } else if (namedFilter.length > 1) {
      where['$and'] = namedFilter;
    }

    if (searchText && searchText != '') {
      const searchPattern = new RegExp('.*' + searchText + '.*', 'i');
      //
      const searchFilter = {
        $or: [
          { name: searchPattern },
          // { suppId: searchPattern },          
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

    const partners = await this.partnerModel
      .find(where)
      .skip(skip)
      .limit(limit)
      .sort(orderBy);
    for (const partner of partners) {
      if (partner.modelRef == 'Customer') {
        const customer = await this.customerModel.findOne({ _id: partner.modelId })
        if (customer) {
          partner.set('phoneNumber', customer.tel1b, { strict: false })
          partner.set('nickName',customer.nickname,{strict:false})
          partner.set('modelNo',customer.cusNo,{strict:false})
        }
      }
      else if (partner.modelRef == 'Supplier') {
        const supplier = await this.supplierModel.findOne({ _id: partner.modelId })
        if (supplier) {
          partner.set('phoneNumber', supplier.tel1b, { strict: false })
          partner.set('nickName',supplier.nickname,{strict:false})
          partner.set('modelNo',supplier.suppId,{strict:false})
        }
      }
    }

    const count = await this.partnerModel.countDocuments(where);
    return [partners, count];
  }


  async findOne(id: string): Promise<Partner> {
    return await this.partnerModel.findById(id);
  }

  async update(
    id: string,
    updatePartnerDto: UpdatePartnerDto,
  ): Promise<Partner> {
    const response = await this.partnerModel.findByIdAndUpdate(
      id,
      updatePartnerDto,
      { new: true },
    );
    return response;
  }

  async remove(id: string): Promise<any> {
    return await this.partnerModel.findByIdAndRemove(id);
  }

  async removeType(model:string, modelId: string) : Promise<any> {
    return await this.partnerModel.remove({ modelRef: model, modelId: modelId});
  }
}
