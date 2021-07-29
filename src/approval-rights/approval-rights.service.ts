import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApprovalRight } from './approval-rights.interface';
import { CreateApprovalRightDto } from './dto/create-approval-right.dto';
import { UpdateApprovalRightDto } from './dto/update-approval-right.dto';
import { UsersService } from '../users/users.service';
import { User } from '../users/users.interface';

@Injectable()
export class ApprovalRightsService {
  constructor(
    @InjectModel('ApprovalRight')
    private readonly approvalRightModel: Model<ApprovalRight>,
    private readonly usersService: UsersService,
  ) {}

  createNewApprovalRight(
    createApprovalRightDto: CreateApprovalRightDto,
  ): Promise<ApprovalRight> {
    if (createApprovalRightDto.type) {
      createApprovalRightDto.type = createApprovalRightDto.type.toLowerCase();
    }
    const newLocation = new this.approvalRightModel(createApprovalRightDto);
    return newLocation.save();
  }

  async getAllApprovalRights(approvaltype:string): Promise<ApprovalRight[]> {
    let response = await this.approvalRightModel.find({ type: approvaltype}).exec();
  return response
  }
  

  async getApprovalRightById(id: string): Promise<ApprovalRight> {
    const response = await this.approvalRightModel.findById(id);
    if (!response) {
      throw new NotFoundException('Approval rights not found');
    }
    return response;
  }

  async updateApprovalRightById(
    id: string,
    updateApprovalRightDto: UpdateApprovalRightDto,
  ): Promise<ApprovalRight> {
    if (updateApprovalRightDto.type) {
      updateApprovalRightDto.type = updateApprovalRightDto.type.toLowerCase();
    }

    const response = await this.approvalRightModel.findByIdAndUpdate(
      id,
      updateApprovalRightDto,
      { new: true },
    );
    return response;
  }

  async removeApprovalRightById(id: string): Promise<any> {
    return await this.approvalRightModel.findByIdAndRemove(id);
  }

  async checkApprovalStatus(user: User, approvalType: string, total:Number): Promise<boolean> {
    const userInfo = await this.usersService.findUserbyId(user.sub);

    if (userInfo) {
      const approvalList = await this.getAllApprovalRights(approvalType);

      const userApprovalRights = approvalList       
        .filter((approval) =>
        approval.roles.some((role) => userInfo.roles.includes(role)),
        );

      console.log(userApprovalRights);
      console.log("found approval");

      if(userApprovalRights.length > 0){
        const minObj = userApprovalRights.reduce((accumulator, props) => {
          return accumulator.minAmt < props.minAmt ? accumulator : props;
        });
  
        const maxObj = userApprovalRights.reduce((accumulator, props) => {
          return accumulator.maxAmt < props.maxAmt ? accumulator : props;
        });
      console.log(minObj);
      console.log(maxObj);
  
        if (total >= minObj.minAmt) {
          if(total <= maxObj.maxAmt || maxObj.maxAmt == undefined || maxObj.maxAmt == null){
            console.log(`Balance ${total} is in between, Authorized`);
            return true;
          }
          
        } 
      } 
      
    }
    
    return false;
      
  }
}
