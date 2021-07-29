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
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Payment } from './interfaces/payment.interface';
import {FilterDto} from "../shared/filter.dto";

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  // Create new payment
  @Post()
  async createNewPayment(
    @Body() createPaymentDto: CreatePaymentDto
  ): Promise<Payment> {
    return await this.paymentService.createNewPayment(
        createPaymentDto
    );
  }

  @Post('getfilters')
  async getfilters(@Body() query: FilterDto) {
    const result = await this.paymentService.getfilters(query);
    return result;
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<any> {
    return await this.paymentService.getOnePayment(id);
  }

  @Patch(':id')
  async updatePayment(
      @Param('id') id: string,
      @Body() updatePaymentDto: UpdatePaymentDto
  ) {
    return await this.paymentService.updatePayment(id, updatePaymentDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<any> {
    return await this.paymentService.deleteOnePayment(id);
  }
}
