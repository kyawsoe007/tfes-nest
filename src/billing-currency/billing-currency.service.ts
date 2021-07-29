import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { CreateBillingCurrencyDto } from './dto/create-billing-currency.dto';
import { UpdateBillingCurrencyDto } from './dto/update-billing-currency.dto';
import { BillingCurrency } from './billing-currency.interface';
import { Model } from 'mongoose';

@Injectable()
export class BillingCurrencyService {
  constructor(
    @InjectModel('BillingCurrency')
    private readonly billingCurrencyModel: Model<BillingCurrency>,
  ) {}

  async create(
    createBillingCurrencyDto: CreateBillingCurrencyDto,
  ): Promise<BillingCurrency> {
    const result = new this.billingCurrencyModel(createBillingCurrencyDto);
    return await result.save();
  }

  async findAll(): Promise<BillingCurrency[]> {
    const response = await this.billingCurrencyModel.find().sort({ name: 1 });
    return response;
  }

  async findOne(id: string): Promise<BillingCurrency> {
    const response = await this.billingCurrencyModel.findById(id);
    return response;
  }

  async update(
    id: string,
    updateBillingCurrencyDto: UpdateBillingCurrencyDto,
  ): Promise<BillingCurrency> {
    const response = await this.billingCurrencyModel.findByIdAndUpdate(
      id,
      updateBillingCurrencyDto,
      { new: true },
    );
    return response;
  }

  async remove(id: string) {
    const result = await this.billingCurrencyModel.findByIdAndRemove(id);
    return result;
  }
}
