import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProfitService } from './profit.service';
import { CreateProfitDto } from './dto/create-profit.dto';
import { UpdateProfitDto } from './dto/update-profit.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('ProfitAndLoss')
@Controller('profit')
export class ProfitController {
  constructor(private readonly profitService: ProfitService) { }

  @Post()
  create(@Body() createProfitDto: CreateProfitDto) {
    return this.profitService.create(createProfitDto);
  }

  @Get()
  findAll() {
    return this.profitService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.profitService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProfitDto: UpdateProfitDto) {
    return this.profitService.update(id, updateProfitDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.profitService.remove(id);
  }
}
