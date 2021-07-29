import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  NotFoundException,
  Patch,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ValidateObjectId } from '../shared/validate-object-id.pipes';
import { AccessRolesService } from './access-roles.service';
import { CreateAccessRoleDto } from './dto/create-access-role.dto';
import { UpdateAccessRoleDto } from './dto/update-access-role.dto';

@ApiTags('access-roles')
@Controller('access-roles')
export class AccessRolesController {
  constructor(private readonly accessRolesService: AccessRolesService) {}

  @Post()
  async create(@Body() createAccessRoleDto: CreateAccessRoleDto) {
    return this.accessRolesService.create(createAccessRoleDto);
  }

  @Get()
  async findAll() {
    return this.accessRolesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', new ValidateObjectId()) id: string) {
    const result = this.accessRolesService.findOne(id);
    if (!result) {
      throw new NotFoundException('user not found!');
    }
    return result;
  }

  @Patch(':id')
  async update(
    @Param('id', new ValidateObjectId()) id: string,
    @Body() updateAccessRoleDto: UpdateAccessRoleDto,
  ) {
    const response = await this.accessRolesService.update(
      id,
      updateAccessRoleDto,
    );
    if (!response) {
      throw new NotFoundException('this access rights does not exist!');
    }
    return response;
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accessRolesService.remove(id);
  }
}
