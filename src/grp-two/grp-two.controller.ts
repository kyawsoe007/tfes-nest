import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
} from '@nestjs/common';
import { GrpTwoService } from './grp-two.service';
import { CreateGrpTwoDto } from './dto/create-grp-two.dto';
import { UpdateGrpTwoDto } from './dto/update-grp-two.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Grp-two')
@Controller('grp-two')
export class GrpTwoController {
  constructor(private readonly grpTwoService: GrpTwoService) {}

  @Post()
  create(@Body() createGrpTwoDto: CreateGrpTwoDto) {
    return this.grpTwoService.create(createGrpTwoDto);
  }

  @Get()
  findAll() {
    return this.grpTwoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.grpTwoService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateGrpTwoDto: UpdateGrpTwoDto) {
    return this.grpTwoService.update(id, updateGrpTwoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.grpTwoService.remove(id);
  }
}
