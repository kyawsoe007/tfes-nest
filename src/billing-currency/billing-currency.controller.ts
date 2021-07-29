import { ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { BillingCurrencyService } from './billing-currency.service';
import { CreateBillingCurrencyDto } from './dto/create-billing-currency.dto';
import { UpdateBillingCurrencyDto } from './dto/update-billing-currency.dto';
import { BillingCurrency } from './billing-currency.interface';

@ApiTags('billing-currency')
@Controller('billing-currency')
export class BillingCurrencyController {
  constructor(
    private readonly billingCurrencyService: BillingCurrencyService
  ) {}

  @Post()
  async create(@Body() createBillingCurrencyDto: CreateBillingCurrencyDto) {
    const result = await this.billingCurrencyService.create(
      createBillingCurrencyDto
    );
    return result;
  }

  @Get()
  async findAll(): Promise<BillingCurrency[]> {
    return await this.billingCurrencyService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<BillingCurrency> {
    return await this.billingCurrencyService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateBillingCurrencyDto: UpdateBillingCurrencyDto
  ): Promise<BillingCurrency> {
    return await this.billingCurrencyService.update(
      id,
      updateBillingCurrencyDto
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.billingCurrencyService.remove(id);
  }
}
