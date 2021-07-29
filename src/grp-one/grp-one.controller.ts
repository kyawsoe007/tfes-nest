import { ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
} from '@nestjs/common';
import { GrpOneService } from './grp-one.service';
import { CreateGrpOneDto } from './dto/create-grp-one.dto';
import { UpdateGrpOneDto } from './dto/update-grp-one.dto';

@ApiTags('Grp-one')
@Controller('grp-one')
export class GrpOneController {
  constructor(private readonly grpOneService: GrpOneService) {}

  @Post()
  create(@Body() createGrpOneDto: CreateGrpOneDto) {
    return this.grpOneService.create(createGrpOneDto);
  }

  @Get()
  findAll() {
    return this.grpOneService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.grpOneService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateGrpOneDto: UpdateGrpOneDto) {
    return this.grpOneService.update(id, updateGrpOneDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.grpOneService.remove(id);
  }
}
