import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FilterDto } from 'src/shared/filter.dto';
import { SupplierInvoiceService } from './supplier-invoice.service';
import { CreateSupplierInvoiceDto } from './dto/create-supplier-invoice.dto';
import { UpdateSupplierInvoiceDto } from './dto/update-supplier-invoice.dto';
import { SupplierInvoice } from './interfaces/supplier-invoice.interface';

@ApiTags('SupplierInvoice')
@Controller('supplier-invoice')
export class SupplierInvoiceController {
  constructor(private readonly supplierInvoiceService: SupplierInvoiceService) {}
  // Create new invoice
  @Post()
  async createNewInvoice(
    @Body() createSupplierInvoiceDto: CreateSupplierInvoiceDto
  ): Promise<SupplierInvoice> {
    return await this.supplierInvoiceService.createNewInvoice(
        createSupplierInvoiceDto
    );
  }

  // Fill All Invoices
  @Get('all')
  async findAll() {
    const result = await this.supplierInvoiceService.findAll();
    if (result.length < 1) {
      throw new NotFoundException('Invoice is empty');
    }
    return result;
  }

  // Find All + Filtered
  @Post('getfilters')
  async getfilters(@Body() query: FilterDto) {
    const result = await this.supplierInvoiceService.getfilters(query);
    return result;
  }

  @Get('/dropdown-group')
  async findAllDrop() {
    const result = await this.supplierInvoiceService.findAllInvoiceDropdownGroup();
    return result;
  }

  // Find Single invoice
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<SupplierInvoice> {
    const result = await this.supplierInvoiceService.findOne(id);
    if (!result) {
      console.log('invoice not found');
      throw new NotFoundException('invoice not found!');
    }
    return result;
  }

  // Update Single invoice
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateInvoiceDto: UpdateSupplierInvoiceDto
  ) {
    const updatedInvoice = await this.supplierInvoiceService.update(
      id,
        updateInvoiceDto
    );

    if (!updatedInvoice) {
      throw new InternalServerErrorException('invoice failed to update!');
    }
    return updatedInvoice;
  }

  // Delete Single invoice
  @Delete(':id')
  remove(@Param('id') id: string): Promise<any> {
    return this.supplierInvoiceService.removeOne(id);
  }

  async getSalesOrder(id: string): Promise<SupplierInvoice> {
    const result = this.supplierInvoiceService.getInvoice(id);
    if (!result) {
      throw new NotFoundException('invoice not found!!');
    }
    return result;
  }
}

