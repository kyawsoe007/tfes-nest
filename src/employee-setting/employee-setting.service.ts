import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FilterDto } from 'src/shared/filter.dto';
import { CreateEmployeeSettingDto } from './dto/create-employee-setting.dto';
import { UpdateEmployeeSettingDto } from './dto/update-employee-setting.dto';
import { EmployeeSetting } from './employee-setting.interface';
import { SequenceSettingsService } from '../sequence-settings/sequence-settings.service';
import { User } from 'src/users/users.interface';

@Injectable()
export class EmployeeSettingService {
  constructor(
    @InjectModel('EmployeeSetting')
    private readonly employeeSettingModel: Model<EmployeeSetting>,
    private readonly sequenceSettingsService: SequenceSettingsService,
  ) { }

  async create(
    createEmployeeSettingDto: CreateEmployeeSettingDto
  ): Promise<EmployeeSetting> {
    const modelName = 'EmployeeSetting';
    const settings = await this.sequenceSettingsService.FindSequenceByModelName(
      modelName,
    );

    const newEmployeeNumber = this.sequenceSettingsService.sequenceSettingEx(settings);
    createEmployeeSettingDto.number = newEmployeeNumber;

    //update sequence number
    await this.sequenceSettingsService.updateSequenceByModelName(
      modelName,
      settings,
    );

    const keys = Object.keys(createEmployeeSettingDto);
    keys.forEach((key) => {
      if (createEmployeeSettingDto[key] == '') {
        delete createEmployeeSettingDto[key];
      }
    });
    const newCat = new this.employeeSettingModel(createEmployeeSettingDto);

    return await newCat.save();
  }

  //Find All + Filter
  async getfilters(query: FilterDto,user:User): Promise<any> {
    const limit = query.limit ? query.limit : 0;
    const skip = query.skip ? query.skip : 0;
    const filter = query.filter ? query.filter : [];
    const searchText = query.searchText ? query.searchText : '';
    const orderBy = query.orderBy ? query.orderBy : '';
    console.log('user',user)
    let where = {};
    const namedFilter = [];
  //   if(!user.isManager){
  //     namedFilter.push({user:user.sub})
  // }
    if (filter != null) {
      for (let i = 0; i < filter.length; i++) {
        const property = Object.keys(filter[i])[0];
        const propVal = Object.values(filter[i])[0];
        // if (property === 'status') {
        //   if (propVal !== '') {
        //     if (Array.isArray(propVal)) {
        //       //if in array
        //       const soStatusArray = propVal as Array<string>;
        //       const salesOrderFound = await this.employeeSettingModel.find({
        //         status: { $in: soStatusArray },
        //       });
        //       // map - get each status - push each into array object
        //       // const soStatus = salesOrderFound.map((item) => item.status);
        //       // namedFilter.push({ status: { $in: soStatus } });
        //     } else {
        //       // if not in Array
        //       namedFilter.push({ status: propVal });
        //     }
        //   }
        // } else if (property === 'total') {
        //   if (Array.isArray(propVal)) {
        //     if (propVal[0] === '') {
        //       // if min field is empty, filter (less than)
        //       namedFilter.push({ total: { $lte: parseInt(propVal[1]) } });
        //     } else if (propVal[1] === '') {
        //       // if max field is empty, filter (greater than)
        //       namedFilter.push({ total: { $gte: parseInt(propVal[0]) } });
        //     } else {
        //       // else filter (greater and lesser)
        //       namedFilter.push({
        //         total: {
        //           $gte: parseInt(propVal[0]),
        //           $lte: parseInt(propVal[1]),
        //         },
        //       });
        //     }
        //   }
        // } 
         if (property === 'updatedAt') {
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
          { number: searchPattern }, // Employee Number
          { idNumber: searchPattern }, // id Number
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

    const employeeSetting = await this.employeeSettingModel
      .find(where)
      .skip(skip)
      .limit(limit)
      .sort(orderBy);
    //.populate(['currency', 'paymentTerm']);
    //console.log('employee', employeeSetting)
    const count = await this.employeeSettingModel.countDocuments(where);
    // console.log('invoice',employeeSetting)
    return [employeeSetting, count];
  }


  async findAll(): Promise<EmployeeSetting[]> {
    const response = await this.employeeSettingModel.find();
    return response;
  }
  async findOne(id: string): Promise<EmployeeSetting> {
    return await this.employeeSettingModel.findOne({ _id: id });
  }
  async findWithUserId(id:string):Promise<EmployeeSetting>{
    return await this.employeeSettingModel.findOne({user:id})
  }
  async update(id: string, updateEmployeeSettingDto: UpdateEmployeeSettingDto): Promise<EmployeeSetting> {
    // const modelName = 'EmployeeSetting';
    // if (!updateEmployeeSettingDto.number) {
    //   const settings = await this.sequenceSettingsService.FindSequenceByModelName(modelName)
    //   const newEmpNumber = await this.sequenceSettingsService.sequenceSettingEx(settings)
    //   updateEmployeeSettingDto.number = newEmpNumber
    // }

    await this.employeeSettingModel.findByIdAndUpdate(
      { _id: id },
      updateEmployeeSettingDto,
    );

    return this.findOne(id);
  }

  async updateOneWithLeave(id: string, data: any) {
    return await this.employeeSettingModel.findByIdAndUpdate(
      { _id: id },
      data
    )
  }


  async remove(id: string): Promise<any> {
    const response = await this.employeeSettingModel.findByIdAndRemove({ _id: id });
    return response;
  }
}
