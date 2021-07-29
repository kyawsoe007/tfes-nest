import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Response } from 'express';

import { Model } from 'mongoose';
import { AccessRightsService } from '../access-rights/access-rights.service';
import { AccessRolesService } from '../access-roles/access-roles.service';
import { AuthService } from '../auth/auth.service';
import { ChangePasswordUserDto } from './dto/change-password-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './users.interface';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    private readonly accessRightsService: AccessRightsService,
    private readonly accessRolesService: AccessRolesService,
    private readonly authService: AuthService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const userExists = await this.userModel.findOne({
      email: createUserDto.email,
    });

    if (userExists) {
      throw new NotFoundException(`user was existed`);
    }

    const accessRights = [];
    const hasManagerRights = [];
    if (createUserDto.roles) {
      for (const name of createUserDto.roles) {
        const rights = await this.accessRightsService.findByName(name);
        if (rights !== null) {
          accessRights.push(rights.access);
          hasManagerRights.push(rights.isManager);
        }
      }
      const managerChecked = hasManagerRights.some(
        (isManager: boolean) => isManager === true,
      );
      const rolesInArray = Array.prototype.concat.apply([], accessRights);
      const uniqueRoles = rolesInArray.filter((rights, index, array) => {
        if (array.indexOf(rights) === index) {
          return rights;
        }
      });
      createUserDto.access = uniqueRoles;
      createUserDto.isManager = managerChecked;
    } else {
      throw new BadRequestException('Missing user roles');
    }

    const createdUser = await this.userModel.create(createUserDto);

    if (createdUser) {
      for (const name of createUserDto.roles) {
        const accessRights = await this.accessRightsService.findByName(name);

        if (accessRights) {
          const createAccessRoleDto = {
            user: createdUser._id,
            role: accessRights._id,
          };
          await this.accessRolesService.create(createAccessRoleDto);
        } else {
          throw new NotFoundException(
            'roles not found, kindly insert role in AccessRights Model',
          );
        }
      }
    }

    return createdUser;
  }

  async changePassword(
    user: any,
    changePasswordUserDto: ChangePasswordUserDto,
    response: Response,
  ) {
    const userData = await this.findOneByEmail(user.email);

    if (userData) {
      userData.password = changePasswordUserDto.confirmNewPassword;
    }

    const updatedUser = await userData.save();

    return await this.authService.login(updatedUser, response);
  }

  async findOneByEmail(email: string): Promise<User> {
    const user = this.userModel.findOne({ email: email });
    if (user) {
      return user;
    }
    throw new NotFoundException(`user not found`);
  }

  async findUserbyId(id: string): Promise<User> {
    const user = this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException(`user not found`);
    }

    return user;
  }

  async findAll(): Promise<User[]> {
    const response = await this.userModel.find().sort({ firstName: 1 });
    return response;
  }

  async getMyProfile(user: any): Promise<any> {
    const data = await this.userModel.findById(user.sub);
    if (data) {
      return {
        _id: data._id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        roles: data.roles,
        access: data.access,
        mobile: data.mobile,
        movement: data.movement,
      };
    } else {
      throw new Error('User not found');
    }
  }

  async getMyProfileUpdate(
    user: any,
    updateUserDto: UpdateUserDto,
  ): Promise<any> {
    const data = await this.userModel.findById(user.sub);
    if (data) {
      data.firstName = updateUserDto.firstName;
      data.lastName = updateUserDto.lastName;
      data.mobile = updateUserDto.mobile;

      return await data.save();
    } else {
      throw new NotFoundException('User not found');
    }
  }
  // : Promise<User>
  async update(id: string, updateUserDto: UpdateUserDto) {
    const data = await this.findUserbyId(id);
    console.log(updateUserDto);
    if (data) {
      const accessRights = [];
      if (updateUserDto.roles) {
        for (const name of updateUserDto.roles) {
          const rights = await this.accessRightsService.findByName(name);
          if (rights !== null) {
            accessRights.push(rights.access);
          }
        }
        const rolesInArray = Array.prototype.concat.apply([], accessRights);

        const uniqueRoles = rolesInArray.filter((rights, index, array) => {
          if (array.indexOf(rights) === index) {
            return rights;
          }
        });

        updateUserDto.access = uniqueRoles;
      } else {
        throw new BadRequestException('Missing user roles');
      }

      data.firstName = updateUserDto.firstName;
      data.lastName = updateUserDto.lastName;
      data.mobile = updateUserDto.mobile;
      data.roles = updateUserDto.roles;
      data.access = updateUserDto.access;
      if (updateUserDto.password) {
        data.password = updateUserDto.password;
      }

      if (updateUserDto.movement) {
        data.movement = updateUserDto.movement;
      }

      const updatedUser = await data.save();

      // To Delete and insert new Roles in AccessRoles Model
      if (updatedUser) {
        await this.accessRolesService.removeAllByUserId(updatedUser._id);

        for (const name of updatedUser.roles) {
          const accessRights = await this.accessRightsService.findByName(name);

          const updateAccessRoleDto = {
            user: data._id,
            role: accessRights._id,
          };

          await this.accessRolesService.create(updateAccessRoleDto);
        }
      }

      return updatedUser;
    } else {
      throw new NotFoundException('User not found');
    }
  }

  async findAllPic(): Promise<User[]> {
    const response = await this.userModel
      .find({}, 'lastName firstName')
      .sort({ firstName: 1 });
    if (!response) {
      throw new NotFoundException('No user found');
    }
    return response;
  }

  async findOnePic(id: string): Promise<User> {
    return await this.userModel.findOne({ _id: id });
  }

  async removeUser(id: string): Promise<any> {
    return await this.userModel.findByIdAndRemove(id);
  }

  async findAllFilterRoleAndUpdateUser(
    roleName: string,
    isManager: boolean,
  ): Promise<User[]> {
    const userInfo = await this.userModel.find({
      roles: { $in: [roleName] },
    });

    if (userInfo) {
      for (const user of userInfo) {
        const accessRights = [];
        for (const roleName of user.roles) {
          const rights = await this.accessRightsService.findByName(roleName);
          if (rights !== null) {
            accessRights.push(rights.access);
          }
        }

        const rolesInArray = Array.prototype.concat.apply([], accessRights);

        const uniqueRoles = rolesInArray.filter((rights, index, array) => {
          if (array.indexOf(rights) === index) {
            return rights;
          }
        });

        user.access = uniqueRoles;
        user.isManager = isManager;

        await user.save();
      }
    }

    return userInfo;
  }
}
