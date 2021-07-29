import { ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Patch,
} from '@nestjs/common';
import { IncotermService } from './incoterm.service';
import { CreateIncotermDto } from './dto/create-incoterm.dto';
import { UpdateIncotermDto } from './dto/update-incoterm.dto';

@ApiTags('IncoTerm')
@Controller('incoterm')
export class IncotermController {
  constructor(private readonly incotermService: IncotermService) {}

  @Post()
  create(@Body() createIncotermDto: CreateIncotermDto) {
    return this.incotermService.create(createIncotermDto);
  }

  @Get()
  async findAll() {
    const result = await this.incotermService.findAll();
    return result;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.incotermService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateIncotermDto: UpdateIncotermDto,
  ) {
    return this.incotermService.update(id, updateIncotermDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.incotermService.remove(id);
  }
}
