import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SaleTargetService } from './sale-target.service';
import { CreateSaleTargetDto } from './dto/create-sale-target.dto';
import { UpdateSaleTargetDto } from './dto/update-sale-target.dto';
import { ApiTags } from '@nestjs/swagger';
import { SaleTarget } from './sale-target.interface';
@ApiTags('SaleTarget')
@Controller('sale-target')
export class SaleTargetController {
  constructor(private readonly saleTargetService: SaleTargetService) {}

  @Post()
  async create(@Body() createSaleTargetDto: CreateSaleTargetDto) {
    return await this.saleTargetService.create(createSaleTargetDto);
  }

  @Get()
  async findAll() {
    return await this.saleTargetService.findAll();
  }
  @Get('/dashboard')
  async getDashBoardPerform() {
    return await this.saleTargetService.getDashBoardPerform();
  }
  @Get(':id')
  async findOne(@Param('id') id: string):Promise<SaleTarget> {
    return await this.saleTargetService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string, 
    @Body() updateSaleTargetDto: UpdateSaleTargetDto
  ):Promise<SaleTarget> {
    return await this.saleTargetService.update(id, updateSaleTargetDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.saleTargetService.remove(id);
  }
}
