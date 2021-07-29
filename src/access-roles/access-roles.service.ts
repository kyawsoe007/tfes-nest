import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AccessRole } from './access-role.interface';
import { CreateAccessRoleDto } from './dto/create-access-role.dto';
import { UpdateAccessRoleDto } from './dto/update-access-role.dto';

@Injectable()
export class AccessRolesService {
  constructor(
    @InjectModel('AccessRole')
    private readonly accessRoleModel: Model<AccessRole>,
  ) {}

  async create(createAccessRoleDto: CreateAccessRoleDto) {
    const response = new this.accessRoleModel(createAccessRoleDto);
    return await response.save();
  }
  async findAll() {
    return await this.accessRoleModel.find();
  }
  async findOne(id: string) {
    return await this.accessRoleModel.findById(id);
  }
  async update(id: string, updateAccessRoleDto: UpdateAccessRoleDto) {
    const response = await this.accessRoleModel.findByIdAndUpdate(
      id,
      updateAccessRoleDto,
      { new: true },
    );
    return response;
  }
  async remove(id: string) {
    return await this.accessRoleModel.findByIdAndRemove(id);
  }

  async removeAllByUserId(userId: string) {
    return await this.accessRoleModel.deleteMany({ user: userId });
  }
}
