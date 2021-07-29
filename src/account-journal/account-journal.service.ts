import { AccountJournal } from './account-journal.interface';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateAccountJournalDto } from './dto/create-account-journal.dto';
import { UpdateAccountJournalDto } from './dto/update-account-journal.dto';
import { Model, PromiseProvider } from 'mongoose';
import { CurrenciesService } from 'src/currencies/currencies.service';
import { AccountItemService } from 'src/account-item/account-item.service';
@Injectable()
export class AccountJournalService {
  constructor(
    @InjectModel('AccountJournal')
    private readonly accountJournalModel: Model<AccountJournal>,
    private readonly accountItemService: AccountItemService,
    private readonly currenciesService: CurrenciesService,
  ) {}

  async create(
    createAccountJournalDto: CreateAccountJournalDto,
  ): Promise<AccountJournal> {
    const newData = new this.accountJournalModel(createAccountJournalDto);
    return await newData.save();
  }

  async findAll(): Promise<AccountJournal[]> {
    const response = await this.accountJournalModel
      .find()
      .populate(['debit_account', 'credit_account'])
      .exec();
    await Promise.all(
      response.map(async (prop) => {
        if (prop.currency && prop.currency != '') {
          const Currency = await this.currenciesService.findOne(prop.currency);
          prop.set(`currency_name`, Currency.name, {
            strict: false,
          });
        }
      }),
    );

    return response;
  }

  async findOne(id: string): Promise<AccountJournal> {
    const accountJournal = await this.accountJournalModel.findOne({ _id: id });

    if (!accountJournal) {
      throw new NotFoundException(`This Account doesn't exit`);
    }

    return accountJournal;
  }

  async findOneByName(name: string): Promise<AccountJournal> {
    const accountJournal = await this.accountJournalModel.findOne({
      name: new RegExp(`^${name}$`, 'i'),
    });

    if (!accountJournal) {
      throw new NotFoundException(`This Journal doesn't exit`);
    }

    return accountJournal;
  }

  async update(
    id: string,
    updateAccountJournalDto: UpdateAccountJournalDto,
  ): Promise<AccountJournal> {
    await this.accountJournalModel.findByIdAndUpdate(
      id,
      updateAccountJournalDto,
      { new: true },
    );
    return this.findOne(id);
  }

  async remove(id: string) {
    const deletedAccountJournal = await this.accountJournalModel.findByIdAndRemove(
      {
        _id: id,
      },
    );
    return deletedAccountJournal;
  }
}
