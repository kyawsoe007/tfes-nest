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
import { SelOneService } from './sel-one.service';
import { CreateSelOneDto } from './dto/create-sel-one.dto';
import { UpdateSelOneDto } from './dto/update-sel-one.dto';

@ApiTags('Sel-One')
@Controller('sel-one')
export class SelOneController {
  constructor(private readonly selOneService: SelOneService) {}

  @Post()
  create(@Body() createSelOneDto: CreateSelOneDto) {
    return this.selOneService.create(createSelOneDto);
  }

  @Get()
  findAll() {
    return this.selOneService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.selOneService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateSelOneDto: UpdateSelOneDto) {
    return this.selOneService.update(id, updateSelOneDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.selOneService.remove(id);
  }
}
