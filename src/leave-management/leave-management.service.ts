import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EmployeeSettingService } from 'src/employee-setting/employee-setting.service';
import { SequenceSettingsService } from 'src/sequence-settings/sequence-settings.service';
import { FilterDto } from 'src/shared/filter.dto';
import { CreateLeaveManagementDto } from './dto/create-leave-management.dto';
import { UpdateLeaveManagementDto } from './dto/update-leave-management.dto';
import { LeaveManagement } from './leave-management.interface';
import { User } from '../users/users.interface';
import { UsersService } from 'src/users/users.service';
@Injectable()
export class LeaveManagementService {
  constructor(
    @InjectModel('LeaveManagement')
    private readonly leaveMangementModel: Model<LeaveManagement>,
    private readonly sequenceSettingsService: SequenceSettingsService,
    private readonly employeeSettingService: EmployeeSettingService,
    private readonly userService:UsersService
  ) { }


  async create(
    createLeaveManagementDto: CreateLeaveManagementDto
  ): Promise<LeaveManagement> {

    const modelName = 'LeaveManagement';
    const settings = await this.sequenceSettingsService.FindSequenceByModelName(
      modelName,
    );

    const newLeaveNumber = this.sequenceSettingsService.sequenceSettingEx(settings);
    createLeaveManagementDto.number = newLeaveNumber;

    //update sequence number
    await this.sequenceSettingsService.updateSequenceByModelName(
      modelName,
      settings,
    );

    const keys = Object.keys(createLeaveManagementDto);
    keys.forEach((key) => {
      if (createLeaveManagementDto[key] == '') {
        delete createLeaveManagementDto[key];
      }
    });
    const newCat = await new this.leaveMangementModel(createLeaveManagementDto).save();

    return await this.findOne(newCat._id);
  }

  //Find All + Filter
  async getfilters(query: FilterDto,user:User): Promise<any> {
    const limit = query.limit ? query.limit : 0;
    const skip = query.skip ? query.skip : 0;
    const filter = query.filter ? query.filter : [];
    const searchText = query.searchText ? query.searchText : '';
    const orderBy = query.orderBy ? query.orderBy : '';

    let where = {};
    const namedFilter = [];
    //console.log('userData',user)
    const userData=await this.userService.findUserbyId(user.sub)
  //  console.log('userData',userData)
    if(!userData.access.includes('employee_settings_management')){
      let empdata=await this.employeeSettingService.findWithUserId(user.sub)
      //console.log('hello',empdata)
      namedFilter.push({employeeName:empdata._id})
  }
    if (filter != null) {
      for (let i = 0; i < filter.length; i++) {
        const property = Object.keys(filter[i])[0];
        const propVal = Object.values(filter[i])[0];
        if (property === 'status') {
          if (propVal !== '') {
            if (Array.isArray(propVal)) {
              //if in array
              const soStatusArray = propVal as Array<string>;
              const salesOrderFound = await this.leaveMangementModel.find({
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
          { number: searchPattern }, // Leave Number
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

    const leaveMangement = await this.leaveMangementModel
      .find(where)
      .skip(skip)
      .limit(limit)
      .sort(orderBy)
    
    const count = await this.leaveMangementModel.countDocuments(where);
    return [leaveMangement, count];
  }

  async findAll(): Promise<LeaveManagement[]> {
    const response = await this.leaveMangementModel.find();
    return response;
  }
  async findOne(id: string): Promise<LeaveManagement> {
    const data = await this.leaveMangementModel.findOne({ _id: id });
    if (data.employeeName) {
      const leaveAllWithEmp = await this.leaveMangementModel.find({ employeeName: data.employeeName })
      const empData = await this.employeeSettingService.findOne(data.employeeName);
      let usedAnnualLeave = 0;
      let usedSickLeave = 0
      let leaveCarriedForward=0;
      if(empData.leaveCarriedForward==0){
        if(data.status=='approved'){
          leaveCarriedForward=empData.leaveCarriedForward
        }
      leaveAllWithEmp.map((item) => {
        if (item.type == 'annualLeave') {
          usedAnnualLeave += Number(item.offDays)
        }
        else if (item.type == 'sickLeave') {
          usedSickLeave += Number(item.offDays)
        }
      }
      )
    }
      else if(empData.leaveCarriedForward>0){
        if(data.status=='approved'){
          leaveCarriedForward=empData.leaveCarriedForward
        }
        else{
        leaveCarriedForward=empData.leaveCarriedForward-Number(data.offDays)
      }
    }
      let remainingLeaveOfAnnula = empData.annualLeave - usedAnnualLeave;
      let remainingLeaveOfSick = empData.sickLeave - usedSickLeave;
      // console.log('used', usedAnnualLeave)
      data.set('leaveCarriedForward',leaveCarriedForward,{strict:false})
      data.set('usedAnnualLeave', usedAnnualLeave, { strict: false })
      data.set('usedSickLeave', usedSickLeave, { strict: false })
      data.set('annualLeaveLeft', remainingLeaveOfAnnula, { strict: false })
      data.set('sickLeaveLeft', remainingLeaveOfSick, { strict: false })
    }
    return data
  }
  async update(id: string, updateLeaveManagementDto: UpdateLeaveManagementDto): Promise<LeaveManagement> {
    const findOneData = await this.findOne(id)
    if (updateLeaveManagementDto.status == 'approved') {
      if (updateLeaveManagementDto.employeeName) {
        const empData = await this.employeeSettingService.findOne(updateLeaveManagementDto.employeeName)
        if(empData.leaveCarriedForward>0 && empData.leaveCarriedForward>=Number(updateLeaveManagementDto.offDays)){
          empData.leaveCarriedForward-=Number(updateLeaveManagementDto.offDays)
        }
        else if(empData.leaveCarriedForward>0 && empData.leaveCarriedForward<Number(updateLeaveManagementDto.offDays)){
          const data=Number(updateLeaveManagementDto.offDays)-empData.leaveCarriedForward;
          empData.leaveCarriedForward=0;
          if (updateLeaveManagementDto.type == 'annualLeave') {
            empData.remainingAnnualLeave -= data
          }
          else if (updateLeaveManagementDto.type == 'inLieuLeave') {
            empData.remainingInLieuLeave -= data
          }
          else if (updateLeaveManagementDto.type == 'reservistLeave') {
            empData.reservistLeave -= data
          }
          else if (updateLeaveManagementDto.type == 'childcareLeave') {
            empData.remainingChildCareLeave -= data
          }
          else if (updateLeaveManagementDto.type == 'sickLeave') {
            empData.remianingSickLeave -= data
  
          }
        }
        else if(empData.leaveCarriedForward==0){
        if (updateLeaveManagementDto.type == 'annualLeave') {
          empData.remainingAnnualLeave -= Number(updateLeaveManagementDto.offDays)
        }
        else if (updateLeaveManagementDto.type == 'inLieuLeave') {
          empData.remainingInLieuLeave -= Number(updateLeaveManagementDto.offDays)
        }
        else if (updateLeaveManagementDto.type == 'reservistLeave') {
          empData.reservistLeave -= Number(updateLeaveManagementDto.offDays)
        }
        else if (updateLeaveManagementDto.type == 'childcareLeave') {
          empData.remainingChildCareLeave -= Number(updateLeaveManagementDto.offDays)
        }
        else if (updateLeaveManagementDto.type == 'sickLeave') {
          empData.remianingSickLeave -= Number(updateLeaveManagementDto.offDays)

        }
      }
        await this.employeeSettingService.updateOneWithLeave(empData._id, empData)
      }
    }
    await this.leaveMangementModel.findByIdAndUpdate(
      { _id: id },
      updateLeaveManagementDto,
    );

    return this.findOne(id);
  }

  async remove(id: string): Promise<any> {
    const response = await this.leaveMangementModel.findByIdAndRemove({ _id: id });
    return response;
  }
}
