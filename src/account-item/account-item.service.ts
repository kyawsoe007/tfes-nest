import { CurrenciesService } from 'src/currencies/currencies.service';
import { AccountItem } from './account-item.interface';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateAccountItemDto } from './dto/create-account-item.dto';
import { UpdateAccountItemDto } from './dto/update-account-item.dto';
import { Model } from 'mongoose';
@Injectable()
export class AccountItemService {
  constructor(
    @InjectModel('AccountItem')
    private readonly accountItemModel: Model<AccountItem>,
    private readonly CurrenciesService: CurrenciesService
  ) { }

  async create(createAccountItemDto: CreateAccountItemDto): Promise<AccountItem> {
    const keys = Object.keys(createAccountItemDto);
    keys.forEach((key) => {
      if (createAccountItemDto[key] == '') {
        delete createAccountItemDto[key];
      }
    });
    const newData = new this.accountItemModel(createAccountItemDto);
    // newData.balance==parseInt(newData.debit)-parseInt(newData.credit)
    return await newData.save();
  }

  async findAll(): Promise<AccountItem[]> {
    const response = await this.accountItemModel
      .find({}, `accountCode accountName debit credit balance internalType companyCurrency`)
      .sort({ accountCode: 1 })
      .exec();

    await Promise.all(
      response.map(async (prop) => {
        if (prop.companyCurrency && prop.companyCurrency != '') {
          const Currency = await this.CurrenciesService.getCurrency(
            prop.companyCurrency
          );
          prop.set(`currency`, Currency.name, {
            strict: false
          });
        }

      })
    );
    return response;
  }

  async getfilters(query: any): Promise<any> {
    const limit = parseInt(query.limit ? query.limit : 0);
    const skip = parseInt(query.skip ? query.skip : 0);
    const filter = query.filter ? query.filter : [];
    const searchText = query.searchText ? query.searchText : '';
    const orderBy =
      query.orderBy && Object.keys(query.orderBy).length > 0
        ? query.orderBy
        : { accountCode: 1 };
    let where = {};

    const namedFilter = [];

    if (filter !== null) {
      for (let i = 0; i < filter.length; i++) {
        const property = Object.keys(filter[i])[0];
        const propVal = Object.values(filter[i])[0];

        // console.log("FILTER", propVal)
        if (property === 'internalType') {

          if(Array.isArray(propVal)) {
            namedFilter.push({ internalType: { $in: propVal }})
          }
          namedFilter.push({ internalType: propVal })
        }
      }
    }

    if (namedFilter.length == 1) {
      where = namedFilter[0];
    } else if (namedFilter.length > 1) {
      where['$and'] = namedFilter;
    }

    if (searchText && searchText != '') {
      const searchPattern = new RegExp('.*' + searchText + '.*', 'i');
      const searchFilter = {
        $or: [
          { accountCode: searchPattern },
          { accountName: searchPattern }
        ]
      };
      if (where['$and']) {
        where['$and'].push(searchFilter);
      } else if (Object.keys(where).length > 0) {
        const temp = where;
        where = {};
        where['$and'] = [temp, searchFilter];
      } else {
        where = searchFilter;
      }
    }

    const accountItems = await this.accountItemModel
      .find(where)
      .skip(skip)
      .limit(limit)
      .sort(orderBy);
    for (const account of accountItems) {
      if (account.companyCurrency) {
        const currency = await this.CurrenciesService.getCurrency(account.companyCurrency)
        account.set('currency', currency.name, { strict: false })
      }
    }
    const count = await this.accountItemModel.countDocuments(where);
    return [accountItems, count];
  }

  async findOne(id: string): Promise<AccountItem> {
    const accountItem = await this.accountItemModel.findOne({ _id: id });

    if (!accountItem) {
      throw new NotFoundException(`This Account doesn't exit`);
    }
    if (accountItem.companyCurrency) {
      const Currency = await this.CurrenciesService.getCurrency(
        accountItem.companyCurrency
      );
      accountItem.set(`currency`, Currency.name, {
        strict: false
      })
    }
    //const data=await this.AllDebitAndCredit()
    //console.log('data',data)
    return accountItem;
  }

  async findOneWithName(name: string) {
    const Data = await this.accountItemModel.findOne({ accountName: name })
    return Data._id
  }

  async AllDebitAndCredit(accountId: string) {
    //GET 

    /*
    const data=await this.findAll()
    if (toString.call(data) !== "[object Array]")
    return false;
      
            var totalDebit =  0;
            var totalCredit=0;
            var balance=0;
            for(var i=0;i<data.length;i++)
              
            {
               data[i].balance=balance                  
                if(isNaN(parseInt(data[i].debit))){
                continue;
                 }
                  totalDebit += Number(data[i].debit);
                if(isNaN(parseInt(data[i].credit))){
                  continue;
                }
                totalCredit+=Number(data[i].credit)
                balance=totalDebit-totalCredit  
               }
             return {totalDebit,totalCredit,balance};

    */
  }

  async update(id: string, updateAccountItemDto: UpdateAccountItemDto): Promise<AccountItem> {
    const accountItem = await this.accountItemModel.findOne({ _id: id });
    if (!accountItem) {
      throw new NotFoundException('Account item not Found');
    }
    const response = await this.accountItemModel.findByIdAndUpdate(
      id,
      updateAccountItemDto,
      { new: true }
    );
    return response;
  }

  async remove(id: string) {
    const deletedAccountItem = await this.accountItemModel.findByIdAndRemove({
      _id: id,
    })
    return deletedAccountItem;
  }
  // Fetch All Currency
  async getAllCurrencyDropdown() {
    const currency = await this.CurrenciesService.findAll();
    return { currency };
  }
}

