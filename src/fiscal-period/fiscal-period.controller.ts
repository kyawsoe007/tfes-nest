import { Controller, Get, Post, Body, Put, Param, Delete, Patch } from '@nestjs/common';
import { FiscalPeriodService } from './fiscal-period.service';
import { CreateFiscalPeriodDto } from './dto/create-fiscal-period.dto';
import { UpdateFiscalPeriodDto } from './dto/update-fiscal-period.dto';
import { ApiTags } from '@nestjs/swagger';
import { FiscalYearByMonthly } from 'src/fiscal-year/dto/fiscalYearByMonthly.dto';
@ApiTags('FiscalPeriod')
@Controller('fiscal-period')
export class FiscalPeriodController {
  constructor(private readonly fiscalPeriodService: FiscalPeriodService) {}

  @Post()
  create(@Body() createFiscalPeriodDto: CreateFiscalPeriodDto) {
    return this.fiscalPeriodService.create(createFiscalPeriodDto);
  }

  @Get()
  findAll() {
    return this.fiscalPeriodService.findAll();
  }

  @Get('find_current_date')
  findWithCurrentDate(){
    return this.fiscalPeriodService.findWithCurrentDate();
  }
  
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fiscalPeriodService.findOne(id);
  }
  @Get('findWithYear/:id')
  findWithYearId(@Param('id') id: string) {
    return this.fiscalPeriodService.findWithYearId(id);
  }

  @Post('fiscal_period_data')
  createFiscalPeriod(@Body() query:FiscalYearByMonthly){
    return this.fiscalPeriodService.createFiscalPeriod(query)
  }

  @Patch(':id')
  updateFiscalPeriod(@Param('id') id: string, @Body() query:FiscalYearByMonthly) {
    return this.fiscalPeriodService.updateFiscalPeriod(query);
  }


  // @Put(':id')
  // update(@Param('id') id: string, @Body() updateFiscalPeriodDto: UpdateFiscalPeriodDto) {
  //   return this.fiscalPeriodService.update(id, updateFiscalPeriodDto);
  // }

  @Delete('fiscalYearPeriod/:id')
  removeID(@Param('id') id: string) {
    return this.fiscalPeriodService.removeId(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fiscalPeriodService.remove(id);
  }
}
