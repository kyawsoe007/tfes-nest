import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AccountItemService } from 'src/account-item/account-item.service';
import { CurrenciesService } from 'src/currencies/currencies.service';
import { BalanceSheet } from './balance-sheet.interface';
import { CreateBalanceSheetDto } from './dto/create-balance-sheet.dto';
import { UpdateBalanceSheetDto } from './dto/update-balance-sheet.dto';

@Injectable()
export class BalanceSheetService {
  constructor(
    @InjectModel('BalanceSheet')
    private readonly balanceSheetModel: Model<BalanceSheet>,
    private readonly accountItemService: AccountItemService,
    private readonly currenciesService: CurrenciesService
  ) { }

  async create(createBalanceSheetDto: CreateBalanceSheetDto) {
    let newData = await new this.balanceSheetModel(createBalanceSheetDto).save()
    return this.findOne(newData._id);
  }

  async findAll(): Promise<BalanceSheet[]> {
    const data = await this.balanceSheetModel.find();
    const allAccountItems = await this.accountItemService.findAll()

    await Promise.all(
      data.map(async (item) => {
        if (item.levelOne) {
          let hasMatch = allAccountItems.filter((value) => value._id == item.levelOne)
          if (hasMatch.length > 0) {
            var account = await this.accountItemService.findOne(item.levelOne);
            if (account) {
              account.set('internalType', item.internalType, { strict: false })
              item.set('LevelOne', account, { strict: false });
              // item.set('code', account.accountCode, { strict: false });
              // item.set('account', account.accountName, { strict: false });
              // item.set('currency', account.companyCurrency, { strict: false });
            }
          }
          else {
            item.set('LevelOne', item.levelOne, { strict: false })
          }
        }
        if (item.levelTwo.length > 0) {
          for (const levelTwoAccount of item.levelTwo) {

            if (levelTwoAccount.accountId) {
              var levelTwoAccountItem = await this.accountItemService.findOne(levelTwoAccount.accountId)
              if (levelTwoAccountItem) {
                levelTwoAccount.set('accountCode', levelTwoAccountItem.accountCode, { strict: false });
                levelTwoAccount.set('accountName', levelTwoAccountItem.accountName, { strict: false });
                levelTwoAccount.set('internalType', item.internalType, { strict: false })
                // levelTwoAccount.set('currency', levelTwoAccountItem.companyCurrency, { strict: false });
              }
            }
          }
        }
      })
    )
    return data;
  }

  async findOne(id: string) {
    const data = await this.balanceSheetModel.findOne({ _id: id })
    const allAccountItems = await this.accountItemService.findAll()
    if (data.levelOne) {
      let hasMatch = allAccountItems.filter((value) => value._id == data.levelOne)
      if (hasMatch.length > 0) {
        var account = await this.accountItemService.findOne(data.levelOne);
        if (account) {
          account.set('internalType', data.internalType, { strict: false })
          data.set('LevelOne', account, { strict: false });
          // data.set('account', account.accountName, { strict: false });
          // data.set('currency', account.companyCurrency, { strict: false });
        }
      }
      else {
        data.set('LevelOne', data.levelOne, { strict: false })
      }
    }
    if (data.levelTwo.length > 0) {
      for (const levelTwoAccount of data.levelTwo) {

        if (levelTwoAccount.accountId) {
          var levelTwoAccountItem = await this.accountItemService.findOne(levelTwoAccount.accountId)
          if (levelTwoAccountItem) {
            levelTwoAccount.set('accountCode', levelTwoAccountItem.accountCode, { strict: false });
            levelTwoAccount.set('accountName', levelTwoAccountItem.accountName, { strict: false });
            levelTwoAccount.set('internalType', data.internalType, { strict: false })
            //levelTwoAccount.set('currency', levelTwoAccountItem.companyCurrency, { strict: false });
          }
        }
      }
    }
    return data;
  }

  async update(id: string, updateBalanceSheetDto: UpdateBalanceSheetDto): Promise<BalanceSheet> {
    await this.balanceSheetModel.findOneAndUpdate({ _id: id }, updateBalanceSheetDto, { new: true })
    return this.findOne(id);
  }

  async remove(id: string): Promise<BalanceSheet> {
    return await this.balanceSheetModel.findOneAndRemove({ _id: id });
  }
}
