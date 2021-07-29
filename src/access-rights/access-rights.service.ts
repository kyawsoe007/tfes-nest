import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersService } from '../users/users.service';
import { AccessRight } from './access-rights.interface';

import { CreateAccessRightDto } from './dto/create-access-right.dto';
import { UpdateAccessRightDto } from './dto/update-access-right.dto';

@Injectable()
export class AccessRightsService {
  constructor(
    @InjectModel('AccessRight')
    private readonly accessRightModel: Model<AccessRight>,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  async create(createAccessRightDto: CreateAccessRightDto) {
    const response = new this.accessRightModel(createAccessRightDto);
    return await response.save();
  }
  async findAll() {
    return await this.accessRightModel.find();
  }
  async findById(id: string) {
    return await this.accessRightModel.findById(id);
  }

  async findByName(name: string) {
    return await this.accessRightModel.findOne({ name: name });
  }
  async update(id: string, updateAccessRightDto: UpdateAccessRightDto) {
    console.log('updateAccessRightDto', updateAccessRightDto);
    const response = await this.accessRightModel.findByIdAndUpdate(
      id,
      updateAccessRightDto,
      { new: true },
    );

    await this.usersService.findAllFilterRoleAndUpdateUser(
      updateAccessRightDto.name,
      updateAccessRightDto.isManager,
    );

    return response;
  }
  async remove(id: string) {
    return await this.accessRightModel.findByIdAndRemove(id);
  }
}
