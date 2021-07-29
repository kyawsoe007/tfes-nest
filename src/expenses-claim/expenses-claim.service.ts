import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CurrenciesService } from '../currencies/currencies.service';
import { typeOfCurrency } from '../currencies/dto/create-currency.dto';
import { SequenceSettingsService } from '../sequence-settings/sequence-settings.service';
import { FilterDto } from '../shared/filter.dto';
import { User } from '../users/users.interface';
import { UsersService } from '../users/users.service';
import {
  CreateExpensesClaimDto,
  ExpClaimStatusEnumDto,
} from './dto/create-expenses-claim.dto';
import { UpdateExpensesClaimDto } from './dto/update-expenses-claim.dto';
import { ExpensesClaim } from './expenses-claim.interface';

@Injectable()
export class ExpensesClaimService {
  constructor(
    @InjectModel('ExpensesClaim')
    private readonly expensesClaimModel: Model<ExpensesClaim>,
    private readonly sequenceSettingsService: SequenceSettingsService,
    private readonly usersService: UsersService,
    private readonly currenciesService: CurrenciesService,
  ) {}

  async create(
    createExpensesClaimDto: CreateExpensesClaimDto,
  ): Promise<ExpensesClaim> {
    for (const claimItem of createExpensesClaimDto.claimItems) {
      if (claimItem.currency !== '') {
        //find purchase rate
        const currency = await this.currenciesService.findOne(
          claimItem.currency,
        );
        for (let i = 0; i < currency.currencyRate.length; i++) {
          if (currency.currencyRate[i].type == typeOfCurrency.Sale) {
            if (currency.currencyRate[i].rate > 0) {
              claimItem.currencyRate = currency.latestRate;
              break;
            }
          }
        }
      }
    }

    const result = new this.expensesClaimModel(createExpensesClaimDto);
    return await result.save();
  }

  async findAll(): Promise<ExpensesClaim[]> {
    return await this.expensesClaimModel.find().exec();
  }

  async findOne(id: string): Promise<ExpensesClaim> {
    return await this.expensesClaimModel.findById(id).exec();
  }

  //file id store
  async updateFileId(id: string, file: string): Promise<ExpensesClaim> {
    //console.log('id',id)
    //console.log('file',file)
    return await this.expensesClaimModel.findByIdAndUpdate(
      id,
      { file: file },
      { new: true },
    );
  }

  async update(
    id: string,
    updateExpensesClaimDto: UpdateExpensesClaimDto,
    user: User,
  ): Promise<ExpensesClaim> {
    const modelName = 'ExpensesClaim'; // hard-coded first

    const expensesClaimsDB = await this.expensesClaimModel.findById(id).exec();
    if (!expensesClaimsDB) {
      throw new NotFoundException('Claims not found');
    }

    if (
      updateExpensesClaimDto.status ===
        ExpClaimStatusEnumDto.WAITING_APPROVAL &&
      expensesClaimsDB.claimNo === ''
    ) {
      console.log('Waiting Approval, Generate Sequence');
      const settings = await this.sequenceSettingsService.FindSequenceByModelName(
        modelName,
      );

      const newClaimNo = this.sequenceSettingsService.sequenceSettingEx(
        settings,
      );

      await this.sequenceSettingsService.updateSequenceByModelName(
        modelName,
        settings,
      );

      updateExpensesClaimDto.claimNo = newClaimNo;
      updateExpensesClaimDto.status = ExpClaimStatusEnumDto.WAITING_APPROVAL;
    }

    if (
      updateExpensesClaimDto.status === ExpClaimStatusEnumDto.APPROVED &&
      expensesClaimsDB.status !== ExpClaimStatusEnumDto.APPROVED
    ) {
      console.log('Approved');
      updateExpensesClaimDto.approvedBy = user.sub;
    }

    for (const claimItem of updateExpensesClaimDto.claimItems) {
      if (claimItem.currency !== '') {
        //find purchase rate
        const currency = await this.currenciesService.findOne(
          claimItem.currency,
        );
        for (let i = 0; i < currency.currencyRate.length; i++) {
          if (currency.currencyRate[i].type == typeOfCurrency.Sale) {
            if (currency.currencyRate[i].rate > 0) {
              claimItem.currencyRate = currency.latestRate;
              break;
            }
          }
        }
      }
    }

    const response = await this.expensesClaimModel
      .findByIdAndUpdate(id, updateExpensesClaimDto, { new: true })
      .exec();
    return response;
  }

  async remove(id: string): Promise<any> {
    const expensesClaim = await this.findOne(id);

    if (!expensesClaim) {
      throw new NotFoundException('Claim not found');
    }

    if (expensesClaim.status !== ExpClaimStatusEnumDto.DRAFT) {
      throw new BadRequestException(
        'Claim has been submitted , request denied',
      );
    }
    const result = await this.expensesClaimModel.findByIdAndRemove(id).exec();
    return result;
  }

  async getfilters(query: FilterDto, user: User): Promise<any> {
    const limit = query.limit ? query.limit : 0;
    const skip = query.skip ? query.skip : 0;
    const filter = query.filter ? query.filter : [];
    const searchText = query.searchText ? query.searchText : '';
    const orderBy =
      query.orderBy && Object.keys(query.orderBy).length > 0
        ? query.orderBy
        : { claimNo: -1 };

    let where = {};
    const namedFilter = [];

    // use this when ready for it
    if (!user.access.includes('expense_claim_management')) {
      namedFilter.push({ userClaim: user.sub });
    }

    if (filter != null) {
      for (let i = 0; i < filter.length; i++) {
        const property = Object.keys(filter[i])[0];
        const propVal = Object.values(filter[i])[0];

        console.log('PROPS', property, propVal);
        if (property === 'status') {
          if (propVal !== '') {
            if (Array.isArray(propVal)) {
              //if in array

              namedFilter.push({ status: { $in: propVal } });
            } else {
              // if not in Array
              namedFilter.push({ status: propVal });
            }
          }
        }
      }
    }

    if (namedFilter.length === 1) {
      where = namedFilter[0];
    } else if (namedFilter.length > 1) {
      where['$and'] = namedFilter;
    }
    // console.log(namedFilter);

    //Search and matching
    if (searchText && searchText != '') {
      const searchPattern = new RegExp('.*' + searchText + '.*', 'i');
      const searchFilter = {
        $or: [{ claimNo: searchPattern }, { claimType: searchPattern }],
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

    const expensesClaimListing = await this.expensesClaimModel
      .find(where)
      .skip(skip)
      .limit(limit)
      .sort(orderBy);

    for (const claimList of expensesClaimListing) {
      if (claimList.userClaim) {
        const userclaim = await this.usersService.findOnePic(
          claimList.userClaim,
        );

        if (userclaim) {
          claimList.set('userClaimFirstName', userclaim.firstName, {
            strict: false,
          });

          claimList.set('userClaimLastName', userclaim.lastName, {
            strict: false,
          });
        }
      }

      if (claimList.approvedBy) {
        const approvedUser = await this.usersService.findOnePic(
          claimList.approvedBy,
        );

        if (approvedUser) {
          claimList.set('ApprovedByFirstName', approvedUser.firstName, {
            strict: false,
          });

          claimList.set('ApprovedByLastName', approvedUser.lastName, {
            strict: false,
          });
        }
      }
    }

    const count = await this.expensesClaimModel.countDocuments(where);
    return [expensesClaimListing, count];
  }

  async updateClaimStatus(
    claimId: string,
    status: string,
  ): Promise<ExpensesClaim> {
    return await this.expensesClaimModel.findByIdAndUpdate(
      claimId,
      { status: status },
      { new: true },
    );
  }
}
