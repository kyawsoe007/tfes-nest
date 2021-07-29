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
import { SelTwoService } from './sel-two.service';
import { CreateSelTwoDto } from './dto/create-sel-two.dto';
import { UpdateSelTwoDto } from './dto/update-sel-two.dto';

@ApiTags('Sel-Two')
@Controller('sel-two')
export class SelTwoController {
  constructor(private readonly selTwoService: SelTwoService) {}

  @Post()
  create(@Body() createSelTwoDto: CreateSelTwoDto) {
    return this.selTwoService.create(createSelTwoDto);
  }

  @Get()
  findAll() {
    return this.selTwoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.selTwoService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateSelTwoDto: UpdateSelTwoDto) {
    return this.selTwoService.update(id, updateSelTwoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.selTwoService.remove(id);
  }
}
