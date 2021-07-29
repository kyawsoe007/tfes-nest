import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PaymentTermsService } from './payment-terms.service';
import { CreatePaymentTermDto } from './dto/create-payment-term.dto';
import { UpdatePaymentTermDto } from './dto/update-payment-term.dto';
// import { PaymentTermEntity } from './entities/payment-term.entity';
import { PaymentTerm } from './interfaces/payment-terms.interface';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('PaymentTerm')
@Controller('payment-terms')
export class PaymentTermsController {
  constructor(private readonly paymentTermsService: PaymentTermsService) {}

  @Post()
  createNew(
    @Body() createPaymentTermDto: CreatePaymentTermDto,
  ): Promise<PaymentTerm> {
    return this.paymentTermsService.createNew(createPaymentTermDto);
  }

  @Get()
  async findAll(): Promise<PaymentTerm[]> {
    const result = await this.paymentTermsService.findAll();
    return result;
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<PaymentTerm> {
    return this.paymentTermsService.findOne(id);
  }

  @Patch(':id')
  updateOne(
    @Param('id') id: string,
    @Body() updatePaymentTermDto: UpdatePaymentTermDto,
  ): Promise<PaymentTerm> {
    return this.paymentTermsService.updateOne(id, updatePaymentTermDto);
  }

  @Delete(':id')
  removeOne(@Param('id') id: string): Promise<void> {
    return this.paymentTermsService.removeOne(id);
  }
}
