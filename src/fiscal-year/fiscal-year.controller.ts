import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FiscalYearService } from './fiscal-year.service';
import { CreateFiscalYearDto } from './dto/create-fiscal-year.dto';
import { UpdateFiscalYearDto } from './dto/update-fiscal-year.dto';
import { ApiTags } from '@nestjs/swagger';
import { FiscalYearByMonthly } from './dto/fiscalYearByMonthly.dto';
import { FiscalYear } from './fiscal-year.interface';

@ApiTags('FiscalYear')
@Controller('fiscal-year')
export class FiscalYearController {
  constructor(private readonly fiscalYearService: FiscalYearService) {}

  @Post()
  create(@Body() createFiscalYearDto: CreateFiscalYearDto) {
    return this.fiscalYearService.create(createFiscalYearDto);
  }

  // @Post('get-monthly-data)
  // async findByMonthly(@Body() query: FiscalYearByMonthly) {
  //   const result = await this.fiscalYearService.findByMonthly(query);
  //   return result;
  // }

  @Post('get-fiscal-year')
  findByMonthly(@Body() query:FiscalYearByMonthly){
    return this.fiscalYearService.findByMonthly(query)
  }

  // @Post('get-fiscal-period')
  // createFiscalPeriod(@Body() query:FiscalYearByMonthly){
  //   return this.fiscalYearService.createFiscalPeriod(query)
  // }


  @Get()
  findAll() {
    return this.fiscalYearService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fiscalYearService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFiscalYearDto: UpdateFiscalYearDto):Promise<FiscalYear> {
    return this.fiscalYearService.update(id, updateFiscalYearDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fiscalYearService.remove(id);
  }
}
