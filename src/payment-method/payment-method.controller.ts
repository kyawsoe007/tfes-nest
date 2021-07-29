import { PaymentMethod } from './payment-method.interface';
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaymentMethodService } from './payment-method.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';

@ApiTags('payment-method')
@Controller('payment-method')
export class PaymentMethodController {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  @Post()
  create(@Body() createJournalItemDto: CreatePaymentMethodDto) {
    return this.paymentMethodService.create(createJournalItemDto);
  }

  @Get()
  async findAll(): Promise<PaymentMethod[]> {
    const result=await this.paymentMethodService.findAll();
    return result;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentMethodService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateJournalItemDto: UpdatePaymentMethodDto) {
    return this.paymentMethodService.update(id, updateJournalItemDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paymentMethodService.remove(id);
  }
}
