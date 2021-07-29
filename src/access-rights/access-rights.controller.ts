import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  NotFoundException,
  Patch,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../shared/decorators/public-guard.decorator';
import { ValidateObjectId } from '../shared/validate-object-id.pipes';
import { AccessRightsService } from './access-rights.service';
import { CreateAccessRightDto } from './dto/create-access-right.dto';
import { UpdateAccessRightDto } from './dto/update-access-right.dto';

@ApiTags('access-rights')
@Controller('access-rights')
export class AccessRightsController {
  constructor(private readonly accessRightsService: AccessRightsService) {}

  @Public()
  @Post()
  async create(@Body() createAccessRightDto: CreateAccessRightDto) {
    return this.accessRightsService.create(createAccessRightDto);
  }

  @Get()
  async findAll() {
    return this.accessRightsService.findAll();
  }

  @Get(':id')
  findById(@Param('id', new ValidateObjectId()) id: string) {
    const result = this.accessRightsService.findById(id);
    if (!result) {
      throw new NotFoundException('user not found!');
    }
    return result;
  }

  @Patch(':id')
  async update(
    @Param('id', new ValidateObjectId()) id: string,
    @Body() updateAccessRightDto: UpdateAccessRightDto,
  ) {
    const response = await this.accessRightsService.update(
      id,
      updateAccessRightDto,
    );
    if (!response) {
      throw new NotFoundException('this access rights does not exist!');
    }
    return response;
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accessRightsService.remove(id);
  }
}
