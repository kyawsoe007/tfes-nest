import { ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  NotFoundException,
  Patch,
} from '@nestjs/common';
import { TaxesService } from './taxes.service';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';
import { Tax } from './taxes.interface';

@ApiTags('Taxes')
@Controller('taxes')
export class TaxesController {
  constructor(private readonly taxesService: TaxesService) {}

  @Post()
  async create(@Body() createTaxDto: CreateTaxDto) {
    const result = await this.taxesService.create(createTaxDto);
    return result;
  }

  @Get()
  findAll(): Promise<Tax[]> {
    return this.taxesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Tax> {
    const result = await this.taxesService.findOne(id);
    if (!result) {
      throw new NotFoundException('Tax ID does not exist!');
    }
    return result;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTaxDto: UpdateTaxDto,
  ): Promise<Tax> {
    const result = await this.taxesService.update(id, updateTaxDto);
    if (!result) {
      throw new NotFoundException('Tax ID does not exist!');
    }
    return result;
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Tax> {
    return await this.taxesService.remove(id);
  }
}
