import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AccountItemService } from 'src/account-item/account-item.service';
import { CurrenciesService } from 'src/currencies/currencies.service';
import { CreateProfitDto } from './dto/create-profit.dto';
import { UpdateProfitDto } from './dto/update-profit.dto';
import { Profit } from './profit.interface';

@Injectable()
export class ProfitService {
  constructor(
    @InjectModel('Profit')
    private readonly profitModel: Model<Profit>,
    private readonly accountItemService: AccountItemService,
    private readonly currenciesService: CurrenciesService
  ) { }

  async create(createProfitDto: CreateProfitDto) {
    const newData = new this.profitModel(createProfitDto).save()
    return this.findOne((await newData)._id)
  }

  async findAll(): Promise<Profit[]> {
    const data = await this.profitModel.find();
    await Promise.all(
      data.map(async (item) => {
        if (item.accountId) {
          var account = await this.accountItemService.findOne(item.accountId);
          if (account.companyCurrency) {
            var currency = await this.currenciesService.findOne(account.companyCurrency)
          }
          item.set('code', account.accountCode, { strict: false });
          item.set('account', account.accountName, { strict: false });
          item.set('currency', currency.name, { strict: false });
        }
      })
    )
    return data
  }
  async findOne(id: string): Promise<Profit> {
    const data = await this.profitModel.findOne({ _id: id });
    if (data.accountId) {
      const account = await this.accountItemService.findOne(data.accountId)
      if (account.companyCurrency) {
        var currency = await this.currenciesService.findOne(account.companyCurrency)
      }
      data.set('code', account.accountCode, { strict: false });
      data.set('account', account.accountName, { strict: false });
      data.set('currency', currency.name, { strict: false });
    }
    return data
  }

  async update(id: string, updateProfitDto: UpdateProfitDto): Promise<Profit> {
    await this.profitModel.findByIdAndUpdate(
      { _id: id },
      updateProfitDto,
      { new: true })
    return this.findOne(id);
  }

  async remove(id: string): Promise<Profit> {
    return await this.profitModel.findByIdAndRemove({ _id: id });
  }

  async findByCategorySorted(): Promise<Profit[]> {
    let returnData = [];
    let categories = ['INCOME', 'COGS','Other Income', 'Expenses', 'Other Expenses'];
    for(let i=0; i < categories.length; i++){
      const data = await this.profitModel.find({ internal: categories[i]});      
      returnData = returnData.concat(data);
    }
    
    
    return returnData;
  }
}
