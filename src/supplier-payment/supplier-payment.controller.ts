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
import { SupplierPaymentService } from './supplier-payment.service';
import { CreateSupplierPaymentDto } from './dto/create-supplier-payment.dto';
import { UpdateSupplierPaymentDto } from './dto/update-supplier-payment.dto';
import {FilterDto} from "../shared/filter.dto";
import { SupplierPayment } from './interfaces/supplier-payment.interface';

@ApiTags('Supplier-Payment')
@Controller('supplier-payment')
export class SupplierPaymentController {
  constructor(private readonly supplierPaymentService: SupplierPaymentService) {}
  // Create new invoice
  @Post()
  async createNewPayment(
    @Body() createSupplierPaymentDto: CreateSupplierPaymentDto
  ): Promise<SupplierPayment> {
    return await this.supplierPaymentService.createNewPayment(
        createSupplierPaymentDto
    );
  }

  @Post('getfilters')
  async getfilters(@Body() query: FilterDto) {
    const result = await this.supplierPaymentService.getfilters(query);
    return result;
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<any> {
    return await this.supplierPaymentService.getOnePayment(id);
  }

  @Patch(':id')
  async updatePayment(
      @Param('id') id: string,
      @Body() updateSupplierPaymentDto: UpdateSupplierPaymentDto
  ) {
    return await this.supplierPaymentService.updatePayment(id, updateSupplierPaymentDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<any> {
    return await this.supplierPaymentService.deleteOnePayment(id);
  }
}
