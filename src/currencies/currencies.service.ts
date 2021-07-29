import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose'; // Added new line
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { CreateCurrencyDto } from './dto/create-currency.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';
import { Currency } from './currencies.interface';

@Injectable()
export class CurrenciesService {
  constructor(
    @InjectModel('Currency') private readonly currencyModel: Model<Currency>,
  ) {}

  async create(createCurrencyDto: CreateCurrencyDto): Promise<Currency> {
    const newCurrency = new this.currencyModel(createCurrencyDto);
    const response = await this.currencyModel.findOne({
      symbol: newCurrency.symbol,
    });
    if (response) {
      throw new ForbiddenException('Symbol Name is already exists.');
    }

    return await newCurrency.save();
  }

  async findAll(): Promise<Currency[]> {
    const response = await this.currencyModel
      .find({}, 'name symbol currencySymbol latestRate')
      .sort({ name: 1 });

    const returnData = response.map((item) => {
      item.name = item.symbol;
      item.symbol = undefined;
      return item;
    });

    return returnData;
  }

  async findAllRates(): Promise<Currency[]> {
    const response = await this.currencyModel.find();

    return response;
  }

  async findOne(currencyID: string): Promise<Currency> {
    const response = await this.currencyModel
      .findById(currencyID)
      .sort({ 'currencyRate.date': 1 });

    return response;
  }

  async findLatest(currencyID: string): Promise<Currency> {
    const response = await this.currencyModel.findById(currencyID);
    response.set('currencyRate', undefined, { strict: false });
    return response;
  }

  async update(
    currencyID: string,
    updateCurrencyDto: UpdateCurrencyDto,
  ): Promise<Currency> {
    if (
      updateCurrencyDto.currencyRate &&
      updateCurrencyDto.currencyRate.length > 0
    ) {
      updateCurrencyDto.currencyRate.sort((a, b) => {
        if (a.date > b.date) return -1;
        else if (a.date < b.date) return 1;
        else return 0;
      });
      updateCurrencyDto.latestRate = updateCurrencyDto.currencyRate[0].rate;
    }

    const editedCurrency = await this.currencyModel.findByIdAndUpdate(
      currencyID,
      updateCurrencyDto,
      { new: true },
    );
    return this.findOne(currencyID);
  }

  async remove(currencyID: string): Promise<Currency> {
    const deletedCurrency = await this.currencyModel.findByIdAndRemove(
      currencyID,
    );
    return deletedCurrency;
  }

  async getCurrency(id: string): Promise<Currency> {
    const response = await this.currencyModel.findOne({ _id: id }, 'name rate');
    if (!response) {
      throw new NotFoundException('Currency not found!');
    }
    return response;
  }
}
