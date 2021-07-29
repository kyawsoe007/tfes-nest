// prettier-ignore
/* eslint-disable */
import { JournalEntry } from './journal-entry.interface';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  CreateJournalEntryDto,
  JournalItem,
} from './dto/create-journal-entry.dto';
import { UpdateJournalEntryDto } from './dto/update-journal-entry.dto';
import { SequenceSettingsService } from 'src/sequence-settings/sequence-settings.service';
import { Model } from 'mongoose';
import { FiscalPeriodService } from 'src/fiscal-period/fiscal-period.service';
import { AccountItemService } from 'src/account-item/account-item.service';
import * as moment from 'moment';
import { FilterDto } from 'src/shared/filter.dto';
import { TaxesService } from 'src/taxes/taxes.service';
import { DateAndAccount, DateDto } from './dto/date.dto';
import { CurrenciesService } from 'src/currencies/currencies.service';
import { ProfitService} from 'src/profit/profit.service';
import { BalanceSheetService } from 'src/balance-sheet/balance-sheet.service';

@Injectable()
export class JournalEntryService {
  constructor(
    @InjectModel('JournalEntry')
    private readonly journalEntryModel: Model<JournalEntry>,
    private readonly sequenceSettingsService: SequenceSettingsService,
    private readonly fiscalPeriodService: FiscalPeriodService,
    private readonly accountItemService: AccountItemService,
    private readonly taxesService: TaxesService,
    private readonly currenciesService: CurrenciesService,
    private readonly profitService: ProfitService,
    private readonly balanceSheetService: BalanceSheetService
  ) { }

  async create(
    createJournalEntryDto: CreateJournalEntryDto,
  ): Promise<JournalEntry> {
    const newData = await new this.journalEntryModel(
      createJournalEntryDto,
    ).save();

    // total credit and debit for account item
    const journalEntry = await this.findOne(newData._id);

    for (var journalItem of journalEntry.journalItems) {
      const accountItem = await this.accountItemService.findOne(journalItem.account)
      var credit = Number(accountItem.credit) + Number(journalItem.credit)
      var debit = Number(accountItem.debit) + Number(journalItem.debit)
      var balance = debit - credit
      var totalBalance = Number(accountItem.balance) - balance
      let updateAcc = {
        id: journalItem.account,
        credit: (Math.round(credit * 100) / 100).toString(),
        debit: (Math.round(debit * 100) / 100).toString(),
        balance: totalBalance
      }
      await this.accountItemService.update(updateAcc.id, updateAcc)

    }

    this.removeOpeningEntry(createJournalEntryDto.entryDate);

    return newData;
  }

  async findAll(): Promise<JournalEntry[]> {
    const response = await this.journalEntryModel
      .find()
      .populate('journalValue')
      .exec();
    await Promise.all(
      response.map(async (type) => {
        const fiscalPeriod = await this.fiscalPeriodService.findOne(
          type.period,
        );
        if (fiscalPeriod) {
          type.set('periodName', fiscalPeriod.periodName, { strict: false });
        }
        /*
      for(const JournalItem of type.journalItems){
        const accountItem=await this.accountItemService.findOne(JournalItem.account);
        if(accountItem){
          JournalItem.set('account_name',accountItem.accountName,{strict:false});
        }
      }
      */
      }
      )
    )
    return response;
  }

  async getJournalWithDate(query: DateDto): Promise<JournalEntry[]> {
    const start_date = query.startDate ? query.startDate : null;
    const end_date = query.endDate ? query.endDate : null;
    let array = [];
    let res;
    if(start_date == null || end_date == null){
      if(start_date == null && end_date == null){
        res = await this.journalEntryModel.find()
      }
      else if(start_date == null){
        res = await this.journalEntryModel.find({ entryDate: {$lte: new Date(end_date) } })
      }
      else if(end_date == null){
        res = await this.journalEntryModel.find({ entryDate: { $gte: new Date(start_date) } })
      }
    }
    else {
      res = await this.journalEntryModel.find({ entryDate: { $gte: new Date(start_date), $lte: new Date(end_date) } })
    }
        
    if (res.length > 0) {
      for (let i = 0; i < res.length; i++) {
        if (res[i].journalItems.length > 0) {
          for (let j = 0; j < res[i].journalItems.length; j++) {
            if (res[i].journalItems[j].account) {
              var account = await this.accountItemService.findOne(res[i].journalItems[j].account)
            }
            if (res[i].journalItems[j].currency) {
              var currency = await this.currenciesService.findOne(res[i].journalItems[j].currency)
            }
            let vv = {
              journlEntrynum: res[i].journalEntryNum,
              reference: res[i].reference,
              date: moment(res[i].entryDate).format('DD/MM/YYYY'),
              remarks: res[i].remarks,
              totalDebit: res[i].totalDebit,
              totalCredit: res[i].totalCredit,
              journalItem: res[i].journalItems[j],
              JournalItemAccountName: account && account.accountName ? account.accountName : "",
              journalItemCurrencyName: currency && currency.name ? currency.name : ""
            }
            array.push(vv)
          }
        }
      }

    }
    else {
      let emptyArray = {
        journlEntrynum: '',
        reference: '',
        date: '',
        remarks: '',
        totalDebit: '',
        totalCredit: '',
        journalItem: '',
        JournalItemAccountName: '',
        journalItemCurrencyName: ''
      }
      array.push(emptyArray)
    }

    return array
  }

  async getJournalWithDateAndAccount(query: DateAndAccount): Promise<any[]> {
    const start_date = query.startDate ? new Date(query.startDate) : new Date();
    const end_date = query.endDate ? new Date(query.endDate) : new Date();
    const accountFiler = query.account ? query.account : null
    let array = [];
    let res;
    if(start_date == null || end_date == null){
      if(start_date == null && end_date == null){
        res = await this.journalEntryModel.find({$or: [{ isOpening: false }, { isOpening: { $exists: false } }], 'journalItems.account': accountFiler }).sort({entryDate: 1});
      }
      else if(start_date == null){
        res = await this.journalEntryModel.find({$or: [{ isOpening: false }, { isOpening: { $exists: false } }], entryDate: { $lte: end_date }, 'journalItems.account': accountFiler }).sort({entryDate: 1});
      }
      else if(end_date == null){
        res = await this.journalEntryModel.find({$or: [{ isOpening: false }, { isOpening: { $exists: false } }], entryDate: { $gte: start_date }, 'journalItems.account': accountFiler }).sort({entryDate: 1});
      }
    }
    else {
      res = await this.journalEntryModel.find({$or: [{ isOpening: false }, { isOpening: { $exists: false } }], entryDate: { $gte: start_date, $lte: end_date }, 'journalItems.account': accountFiler }).sort({entryDate: 1});
    }

    if (res.length > 0) {
      //get opening entry
      let openingBalanceItems = await this.getOpening(start_date);
      let openingAmount = 0;
      //find opening accoutn amount or 0
      for (let j = 0; j < openingBalanceItems.journalItems.length; j++) {

        if (openingBalanceItems.journalItems[j].account == accountFiler && openingBalanceItems.journalItems[j].name.toLowerCase().includes("opening")) {
          let debit = openingBalanceItems.journalItems[j].debit ? Math.round(openingBalanceItems.journalItems[j].debit.valueOf() * 100) / 100 : 0;
          let credit = openingBalanceItems.journalItems[j].credit ? Math.round(openingBalanceItems.journalItems[j].credit.valueOf() * 100) / 100 : 0;
          
          openingAmount = debit - credit;
        }
      }
      //find all amounts between opening and start date      
      if(start_date.getDate() != 1){
        let newStartDate = new Date(start_date.getFullYear(), start_date.getMonth(), 1);
        const openingRes = await this.journalEntryModel.find({$or: [{ isOpening: false }, { isOpening: { $exists: false } }], entryDate: { $gte: newStartDate, $lt: start_date }, 'journalItems.account': accountFiler }).sort({entryDate: 1});
        for(let i=0; i < openingRes.length; i++){
          for(let j=0; j < openingRes[i].journalItems.length; j++){
            if(openingRes[i].journalItems[j].account.toString() == accountFiler){
              openingAmount += openingRes[i].journalItems[j].debit - openingRes[i].journalItems[j].credit;
            }
          }
        }
      }

      array.push({
        journlEntrynum: "",
        reference: "OPENING",
        date: "",
        remarks: "",
        debit: "",
        credit: "",
        balanceLeft: openingAmount,
        journalItem: "",
        JournalItemAccountName: "",
        journalItemCurrencyName: ""
      })


      for (let i = 0; i < res.length; i++) {
        if (res[i].journalItems.length > 0) {
          for (let j = 0; j < res[i].journalItems.length; j++) {
           
            if (res[i].journalItems[j].currency) {
              var currency = await this.currenciesService.findOne(res[i].journalItems[j].currency)
            }
            if (accountFiler) {
              var accountItem = await this.accountItemService.findOne(accountFiler)
              if (res[i].journalItems[j].account.toString() == accountFiler) {
                let debit = res[i].journalItems[j].debit > 0 ? Math.round(res[i].journalItems[j].debit * 100)/100 : 0;
                let credit = res[i].journalItems[j].credit > 0 ? Math.round(res[i].journalItems[j].credit * 100)/100 : 0;
                let data = {
                  journlEntrynum: res[i].journalEntryNum,
                  reference: res[i].reference,
                  date: moment(res[i].entryDate).format('DD/MM/YYYY'),
                  remarks: res[i].remarks,
                  debit: res[i].journalItems[j].debit,
                  credit: res[i].journalItems[j].credit,
                  balanceLeft: openingAmount + (debit - credit),
                  journalItem: res[i].journalItems[j],
                  JournalItemAccountName: accountItem && accountItem.accountName ? accountItem.accountName : '',
                  journalItemCurrencyName: currency && currency.name ? currency.name : ''
                }
                array.push(data)
                openingAmount += (debit - credit);
              }
            }
            
          }
        }
      }

    }
    else {
      let emptyArray = {
        journlEntrynum: '',
        reference: '',
        date: '',
        remarks: '',
        totalDebit: '',
        totalCredit: '',
        journalItem: '',
        JournalItemAccountName: '',
        journalItemCurrencyName: ''
      }
      array.push(emptyArray)
    }

    return array
  }

  async getfilters(query: FilterDto): Promise<any> {
    console.log("here");
    const limit = query.limit ? query.limit : 0;
    const skip = query.skip ? query.skip : 0;
    const filter = query.filter ? query.filter : [];
    const searchText = query.searchText ? query.searchText : '';
    const orderBy = query.orderBy && Object.keys(query.orderBy).length > 0
      ? query.orderBy
      : { entryDate: -1 };

    let where = {};
    const namedFilter = [];

    if (filter != null) {
      for (let i = 0; i < filter.length; i++) {
        const property = Object.keys(filter[i])[0];
        const propVal = Object.values(filter[i])[0];
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

    //Search and matching
    if (searchText && searchText != '') {
      console.log("SEARCH", searchText);
      const searchPattern = new RegExp('.*' + searchText + '.*', 'i');
      const searchFilter = {
        $or: [
          { journalEntryNum: searchPattern }, // journal entry
          { "journalItems.partner": searchPattern }, // journbal partner 
          { reference: searchPattern }, // journal references 
        ],
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

    const journals = await this.journalEntryModel
      .find(where)
      .skip(skip)
      .limit(limit)
      .sort(orderBy)
      .populate(['journalValue'])

    const count = await this.journalEntryModel.countDocuments(where);
    return [journals, count];
  }

  async findOne(id: string): Promise<JournalEntry> {
    const journalEntry = await this.journalEntryModel.findOne({ _id: id }).populate(['journalValue']);

    if (!journalEntry) {
      throw new NotFoundException(`This Account doesn't exit`);
    }
    for (const JournalItem of journalEntry.journalItems) {
      try {
        const accountItem = await this.accountItemService.findOne(
          JournalItem.account,
        );
        if (accountItem) {
          JournalItem.set('account_name', accountItem.accountName, {
            strict: false,
          });
        }
      }
      catch (e) {
        console.log(e);
      }

    }
    await this.getAllJournalItemsWithAccountId(new Date(), new Date())
    return journalEntry;
  }

  async findOneWithModelId(id: string): Promise<JournalEntry> {
    return await this.journalEntryModel.findOne({ modelId: id })
  }

  async findOneWithInvoiceId(id: string): Promise<JournalEntry> {
    const journalEntry = await this.journalEntryModel.findOne({ _id: id });

    if (!journalEntry) {
      throw new NotFoundException(`This Account doesn't exit`);
    }
    for (const JournalItem of journalEntry.journalItems) {
      const accountItem = await this.accountItemService.findOne(JournalItem.account);
      if (accountItem) {
        JournalItem.set('account_name', accountItem.accountName, { strict: false });
      }
    }
    return journalEntry;
  }

  async getAllAccountData(query: any): Promise<any> {
    const res = Object.values(
      query.journalItems.reduce((acc, { account, credit, debit }) => {
        const key = Object.entries(account).join('-');
        acc[key] = acc[key] || { account, credit: 0, debit: 0 };
        return (acc[key].credit += credit), (acc[key].debit += debit), acc;
      }, {}),
    );
    return await res;
  }
  async getAllDataWithDate(startDate, endDate) {
    const res = await this.journalEntryModel.find({ $or: [{ isOpening: false }, { isOpening: { $exists: false } }], entryDate: { $gte: new Date(startDate), $lte: new Date(endDate) } })
      .populate('journalItems.account')
      .populate('journalItems.currency')
      .exec()
    return res;
  }

  //general report
  async getAllJournalItemsWithAccountId(startDate, endDate) {
    let dataArrayOfJournal = await this.getAllDataWithDate(startDate, endDate)
    //console.log('data',dataArrayOfJournal)
    if (dataArrayOfJournal.length == 0) {
      //throw new InternalServerErrorException('Date Between Journal Entry not Found');
      return [];
    }
    let mapOfJournalItem = await dataArrayOfJournal.map(x => x.journalItems.map((item, i) => { let data = { account: item.account, entryDate: moment(x.entryDate).format('DD-MM-YYYY'), currency: item.currency, credit: item.credit, debit: item.debit, partner: item.partner, name: item.name, amountCurrency: item.amountCurrency, reference: item.reference }; return data }))

    const concatArrayOfJournalItem = [].concat(...mapOfJournalItem)
    const group = {};

    concatArrayOfJournalItem.forEach(({ account, reference, partner, name, dueDate, debit, entryDate, credit, amountCurrency, currency }) => {
      if (account) {
        group[account._id] = group[account._id] || { account: account._id, account_name: account.accountName, journalItem: [] };

        let data = { reference: reference, partner: partner, name: name, debit: debit, entryDate: entryDate, credit: credit, amountCurrency: amountCurrency, currency: currency ? currency.name : '' }
        group[account._id].journalItem.push(data)
      }
      else {
        console.log(reference);
      }

    })
    return await Object.values(group)
  }

  //for gst report
  async getAllJournalEntryWithTaxes(startDate, endDate) {
    let dataArrayOfJournal = await this.getAllDataWithDate(startDate, endDate)
    //console.log('data',dataArrayOfJournal)
    //  if (dataArrayOfJournal.length==0) {
    //   throw new InternalServerErrorException('Date Between Journal Entry not Found');
    let mapOfJournalItem = await dataArrayOfJournal.map(x => x.journalItems.map((item, i) => { let data = { account: item.account, entryDate: moment(x.entryDate).format('DD-MM-YYYY'), currency: item.currency, credit: item.credit, debit: item.debit, partner: item.partner, name: item.name, amountCurrency: item.amountCurrency, reference: item.reference }; return data }))

    const concatArrayOfJournalItem = [].concat(...mapOfJournalItem)
    const group = {};

    concatArrayOfJournalItem.forEach(({ account, reference, partner, name, dueDate, debit, entryDate, credit, amountCurrency, currency }) => {
      if (account) {
        group[account._id] = group[account._id] || { account: account._id, account_name: account.accountName, journalItem: [] };
        let data = { reference: reference, partner: partner, name: name, debit: debit, entryDate: entryDate, credit: credit, amountCurrency: amountCurrency, currency: currency ? currency.name : '' }
        group[account._id].journalItem.push(data)
      }
      else {
        console.log(reference);
      }


    })
    let tax = await this.taxesService.findAll()
    let value = Object.values(group)
    const res = value.filter(f => tax.some(item => (item.account._id).toString() === f['account'].toString()));
    console.log('res', res)
    return await res

  }


  async update(
    id: string,
    updateJournalEntryDto: UpdateJournalEntryDto,
  ): Promise<JournalEntry> {
    const journalEntry = await this.journalEntryModel.findOne({ _id: id });

    if (!journalEntry) {
      throw new NotFoundException('Account item not Found');
    }

    console.log('---update journal entry---', updateJournalEntryDto);

    const journalEntryFound = await this.journalEntryModel
      .findOne({ _id: id })
      .exec();

    if (!journalEntryFound) {
      throw new NotFoundException('Journal Entry not Found');
    }

    if (journalEntry.status == "confirmed") {
      throw new ForbiddenException("Journal entry confirmed. Update not allowed!");
    }

    const { status, journalEntryNum } = journalEntryFound;

    if (
      updateJournalEntryDto.status === 'confirmed' &&
      updateJournalEntryDto.status !== status
    ) {
      if (journalEntryNum) {
        console.log(
          `You have Journal Entry Number: ${journalEntryNum}, you are copyVersion, just proceed to update, No sequence settting is executed`,
        );
      } else {
        const settingsFound = await this.sequenceSettingsService.FindSequenceByModelName(
          'JournalEntry',
        );
        if (!settingsFound) {
          throw new InternalServerErrorException('Model name does not exist!');
        }

        // Generate pattern
        const newSequenceValue = this.sequenceSettingsService.sequenceSettingEx(
          settingsFound,
        );

        updateJournalEntryDto.journalEntryNum = newSequenceValue;

        if (settingsFound) {
          //const newNextNumber = nextNumber + 1;
          const updatedSequence = await this.sequenceSettingsService.updateSequenceByModelName(
            'JournalEntry',
            settingsFound,
          );
          if (!updatedSequence) {
            throw new InternalServerErrorException(
              'Sequence Setting Failed to update!',
            );
          }
        }
      }
    }

    const periodData = await this.fiscalPeriodService.findOneWithInvoiceDate(
      updateJournalEntryDto.entryDate,
    );
    if (periodData) {
      updateJournalEntryDto.period = periodData._id;
    }

    const response = await this.journalEntryModel.findByIdAndUpdate(
      id,
      updateJournalEntryDto,
      { new: true },
    );
    // total credit and debit for account item

    //ONLY UPDATE THE ACCOUNT FOR THE NEW JOURNAL ACCOUNT
    for (var beforeUpdate of journalEntry.journalItems) {
      for (var entry of updateJournalEntryDto.journalItems) {
        var updateCredit = Number(entry.credit);
        var updateDebit = Number(entry.debit);

        const account = await this.accountItemService.findOne(entry.account)
        var accountCredit = Number(account.credit)
        var accountDebit = Number(account.debit)
        var totalCredit = updateCredit + accountCredit;
        var totalDebit = updateDebit + accountDebit;

        if (beforeUpdate.account == entry.account) {
          var beforeUpdateCredit = Number(beforeUpdate.credit)

          var credit = totalCredit - beforeUpdateCredit
          var debit = totalDebit - Number(beforeUpdate.debit)
          var balance = debit - credit
        }
        else if (beforeUpdate.account !== entry.account) {
          var credit = totalCredit
          var debit = totalDebit
          var balance = debit - credit
        }
        const data = {
          id: entry.account,
          credit: (Math.round(credit * 100) / 100).toString(),
          debit: (Math.round(debit * 100) / 100).toString(),
          balance: balance
        }
        await this.accountItemService.update(data.id, data)
      }

    }
    this.removeOpeningEntry(updateJournalEntryDto.entryDate);

    return response;
  }

  async remove(id: string) {
    const journalEntry = await this.findOne(id);
    if (journalEntry.status == "confirmed") {
      throw new ForbiddenException("Journal entry has been confirmed. Delete not allowed!");
    }
    for (var journalItem of journalEntry.journalItems) {
      const accountItem = await this.accountItemService.findOne(journalItem.account)
      var credit = Number(accountItem.credit) - Number(journalItem.credit)
      var debit = Number(accountItem.debit) - Number(journalItem.debit)
      var balance = debit - credit
      var totalBalance = Number(accountItem.balance) - balance
      let updateAcc = {
        id: journalItem.account,
        credit: (Math.round(credit * 100) / 100).toString(),
        debit: (Math.round(debit * 100) / 100).toString(),
        balance: totalBalance
      }
      await this.accountItemService.update(updateAcc.id, updateAcc)
    }

    const deletedJournalEntry = await this.journalEntryModel.findByIdAndRemove({
      _id: id,
    });
    this.removeOpeningEntry(deletedJournalEntry.entryDate);
    return deletedJournalEntry;
  }

  async removeAllJournalEntryBySoNumber(soNumber: string): Promise<any> {
    const response = await this.journalEntryModel.deleteMany({ "journalItems.reference": soNumber })

    console.log('JounalEntryRemoved Removed if any', response);

    return response
  }

  async removeOpeningEntry(entryDate: Date){
    //if there is an update to journal entry, remove next month opening
    let entryMom = moment(entryDate);
    entryMom.add(1, 'month');
    entryMom.startOf('month')
    //remove opening
   let deleted = await this.journalEntryModel.remove({ isOpening: true, entryDate: { $gte: new Date(entryMom.format("YYYY-MM-DD 00:00:00")), $lt: new Date(entryMom.format("YYYY-MM-02 07:59:59"))}});
   console.log(deleted);
  }

  async createMonthOpeningBalance(openingDate: Date): Promise<JournalEntry> {
    //opening date must be beginning of month
    //calculate total of account from previous opneing month
    let endDateObj = moment("01-" + (openingDate.getMonth() + 1) + "-" + openingDate.getFullYear() + " 08:00:00", "DD-MM-YYYY hh:mm:ss").subtract(1, 'days');
    let startDateObj = moment("01-" + (openingDate.getMonth() + 1) + "-" + openingDate.getFullYear() + " 08:00:00", "DD-MM-YYYY hh:mm:ss").subtract(1, 'days').startOf('month');
    //find out there is a previous opening month
    let previousOpening = await this.journalEntryModel.findOne({ isOpening: true, entryDate: { $gte: startDateObj.startOf('day').toDate(), $lt: startDateObj.endOf('day').toDate() } });
    let journalAmounts = {};
    let allJournalItems;
    if (previousOpening) {
      //identify by name (contains the word opening)
      for (let i = 0; i < previousOpening.journalItems.length; i++) {

        if (previousOpening.journalItems[i].name.toLowerCase().includes("opening")) {
          if (journalAmounts[previousOpening.journalItems[i].account]) {
            journalAmounts[previousOpening.journalItems[i].account].debit += previousOpening.journalItems[i].debit ? previousOpening.journalItems[i].debit : 0;
            journalAmounts[previousOpening.journalItems[i].account].credit += previousOpening.journalItems[i].credit ? previousOpening.journalItems[i].credit : 0;
          }
          else {
            journalAmounts[previousOpening.journalItems[i].account] = { debit: 0, credit: 0 }
            journalAmounts[previousOpening.journalItems[i].account].debit += previousOpening.journalItems[i].debit ? previousOpening.journalItems[i].debit : 0;
            journalAmounts[previousOpening.journalItems[i].account].credit += previousOpening.journalItems[i].credit ? previousOpening.journalItems[i].credit : 0;
          }
        }

      }
      console.log(endDateObj.endOf('day').toDate());
      allJournalItems = await this.journalEntryModel.find({ $or: [{ isOpening: false }, { isOpening: { $exists: false } }], entryDate: { $gte: startDateObj.startOf('day').toDate(), $lt: endDateObj.endOf('day').toDate() } });
      console.log("lenG", allJournalItems.length);

    }
    else {
      allJournalItems = await this.journalEntryModel.find({ $or: [{ isOpening: false }, { isOpening: { $exists: false } }], entryDate: { $lt: endDateObj.endOf('day').toDate() } });
    }
    if (allJournalItems.length > 0) {
      for (let i = 0; i < allJournalItems.length; i++) {
        let element = allJournalItems[i];


        for (let j = 0; j < element.journalItems.length; j++) {
          if (element.journalItems[j].account) {
            if (!journalAmounts[element.journalItems[j].account]) {
              journalAmounts[element.journalItems[j].account] = { debit: 0, credit: 0 }
            }
            journalAmounts[element.journalItems[j].account].debit += element.journalItems[j].debit ? element.journalItems[j].debit : 0;
            journalAmounts[element.journalItems[j].account].credt += element.journalItems[j].credit ? element.journalItems[j].credit : 0;

          }
        }

      }
    }
    let totalDebit = 0;
    let totalCredit = 0;
    let newDate = endDateObj.add(1, 'day');
    let newJournalEntry = {
      reference: "OPENING " + newDate.format("MMM YY"),
      remarks: "",
      totalDebit: 0,
      totalCredit: 0,
      entryDate: newDate.toDate(),
      journalItems: [],
      isOpening: true
    }
    let allKeys = Object.keys(journalAmounts);
    for (let i = 0; i < allKeys.length; i++) {
      let key = allKeys[i];
      if (key != undefined) {
        let accountObj = await this.accountItemService.findOne(key);
        let balance = journalAmounts[key].debit - journalAmounts[key].credit;
        let debit = 0;
        let credit = 0;
        if (balance > 0) {
          debit = balance;
          totalDebit += debit;
        }
        else {
          credit = balance * -1;
          totalCredit += credit;
        }

        newJournalEntry.journalItems.push({
          account: key,
          amountCurrency: debit > 0 ? debit : credit,
          name: "OPENING " + accountObj.accountName,
          credit: credit,
          debit: debit,
        });
        newJournalEntry.journalItems.push({
          account: key,
          amountCurrency: debit > 0 ? debit : credit,
          name: "COUNTERPART " + accountObj.accountName,
          credit: debit,
          debit: credit,
        });
        totalCredit += debit;
        totalDebit += credit;

      }

    }
    newJournalEntry.totalCredit = totalCredit;
    newJournalEntry.totalDebit = totalDebit;

    return this.journalEntryModel.create(newJournalEntry);
  }

  async calculatePL(startDateStr:string, endDateStr:string){
    let startDate = new Date(startDateStr);
    let endDate = new Date(endDateStr);
    //start date or end date can be undefined or null
    let returnData = {};
    let pnlAccounts = await this.profitService.findByCategorySorted();
    let currentCategory = "";
    let categoryCount = -1;
    let openingJournals = []; 
    console.log(startDate);   
    //can optimize by getting the opening entry for all previous months
      //opening is the cumulative total of the previous months
    //if start date = 15th june, end date = 10 aug
    //opening aug - opening july = july total
    // + 15 june to end june + start aug to 10 aug
    let openingStartDate = moment("01-" + (startDate.getMonth() + 1) + "-" + startDate.getFullYear() + " 08:00:00", "DD-MM-YYYY hh:mm:ss").startOf('day');
    let openingEndDates = moment(endDate);
    while(openingStartDate.isSameOrBefore(openingEndDates)){

      let openingJ = this.getOpening(openingStartDate.toDate());
      openingJournals.push(openingJ);
      openingStartDate.add(1, 'month');
    }    

    for(let i=0; i < pnlAccounts.length; i++){
      //credit, debit, credit, debit, debit
      if(pnlAccounts[i].internal != currentCategory){
        currentCategory = pnlAccounts[i].internal;
        returnData[currentCategory] = [];        
        categoryCount++;
      }
      let accountItem = await this.accountItemService.findOne(pnlAccounts[i].accountId);
      let total = 0;
      let startDateMom = moment(startDate);
      //check if start date is beginning of month
      //if yes, check if there is record currentl
      //check if there is a record after
      //if yes, minus the 2
      //else find journal items
      while(startDateMom.isBefore(openingEndDates)){
        let noOpening = true;
        if(startDateMom.format('D') == "1"){
          for(let j=0; j < openingJournals.length; j++){
            let entryDate = moment(openingJournals[j].entryDate);
            if(startDateMom.isSame(entryDate, 'day')){
              let nextMonth = moment(startDateMom.format("DD-MM-YYYY"));
              nextMonth.add(1, 'month');
              for(let k=0; k < openingJournals.length; k++){
                let entryDate2 = moment(openingJournals[k].entryDate);
                if(nextMonth.isSame(entryDate2, 'day')){
                  let startCredit = 0;
                  let startDebit = 0;
                  let endCredit = 0;
                  let endDebit = 0;
                  for(let m=0; m < openingJournals[j].journalItems.length; m++){
                    if(openingJournals[j].journalItems[m].account == pnlAccounts[i].accountId && openingJournals[j].journalItems[m].name.toLowerCase().includes("opening")){
                      startCredit = openingJournals[j].journalItems[m].credit ? openingJournals[j].journalItems[m].credit : 0;
                      startDebit = openingJournals[j].journalItems[m].debit ? openingJournals[j].journalItems[m].debit : 0;
                      m = openingJournals[j].journalItems.length;
                    }
                  }
                  for(let m=0; m < openingJournals[k].journalItems.length; m++){
                    if(openingJournals[k].journalItems[m].account == pnlAccounts[i].accountId && openingJournals[k].journalItems[m].name.toLowerCase().includes("opening")){
                      endCredit = openingJournals[k].journalItems[m].credit ? openingJournals[k].journalItems[m].credit : 0;
                      endDebit = openingJournals[k].journalItems[m].debit ? openingJournals[k].journalItems[m].debit : 0;
                      m = openingJournals[k].journalItems.length;
                    }
                  }
                  if(categoryCount == 0 || categoryCount == 2){
                    total += (endCredit - startCredit) - (endDebit - startDebit);
                  }
                  else {
                    
                    total += (endDebit - startDebit) - (endCredit - startCredit);          
                  }
                  k = openingJournals.length;
                  j = openingJournals.length;
                  noOpening = false;
                }
              }
              
            }
          }
        }
        if(noOpening) {          
          let endDateMom = moment(startDateMom.toISOString());
          endDateMom.endOf('month');
          if(endDateMom.isAfter(moment(endDate))){
            endDateMom = moment(endDate);
          }
          console.log(startDateMom.toDate(), endDateMom.toDate());
          console.log(pnlAccounts[i].accountId);
          let journalItems = await this.getJournalWithDateAndAccount({startDate: startDateMom.toDate(), endDate: endDateMom.toDate(), account: pnlAccounts[i].accountId});
          //skip first one
         
          for(let j=1; j < journalItems.length; j++){
            
            if(categoryCount == 0 || categoryCount == 2){
              total += journalItems[j].credit - journalItems[j].debit;
            }
            else {
              
              total += journalItems[j].debit - journalItems[j].credit;          
            }
          }
          total = Math.round(total * 100)/ 100;

        }
        startDateMom.add(1, 'month');
        startDateMom.startOf('month');
      }      
      
      //console.log(accountItem.accountName, total);
      returnData[currentCategory].push({ name: accountItem.accountName, code: accountItem.accountCode, amount: total});

    }
    return returnData;
    /*
    RETURNS
    {
      sales: [{ name: accountname, code: accountCode, amount: $$}, ... ],
      cogs: [{ name: accountname, code: accountCode, amount: $$}, ...],
      otherincome: []
      ...
    }
    */

  }

  async getBalanceSheet(startDate:Date, endDate:Date){
    let returnData = [];
    let bsData = await this.balanceSheetService.findAll();
    for(let i=0; i < bsData.length; i++){
      let bsDataItem:any = bsData[i];
      if(bsDataItem.LevelOne &&bsDataItem.LevelOne.accountCode){
        let journalItems = await this.getJournalWithDateAndAccount({startDate: startDate, endDate: endDate, account: bsDataItem.LevelOne._id});
        let total = 0;

        for(let k=1; k < journalItems.length; k++){
          //skip first one
          if(bsData[i].internalType.includes("Asset")){
            total += journalItems[k].credit - journalItems[k].debit;
          }
          else {
            
            total += journalItems[k].debit - journalItems[k].credit;          
          }
        }
        total = Math.round(total * 100)/ 100;
        bsData[i].set('amount', total, {strict: false});
      }
      for(let j=0; j < bsData[i].levelTwo.length; j++){
        let journalItems = await this.getJournalWithDateAndAccount({startDate: startDate, endDate: endDate, account: bsData[i].levelTwo[j].accountId});
        let total = 0;

        for(let k=0; k < journalItems.length; k++){
          //skip first one
          if(bsData[i].internalType.includes("Asset")){
            total += journalItems[k].debit - journalItems[k].credit;
          }
          else {
            
            total += journalItems[k].credit - journalItems[k].debit;          
          }
        }
        total = Math.round(total * 100)/ 100;
        bsData[i].levelTwo[j].set('amount', total, {strict: false});
      }
      returnData.push(bsData[i]);
    }
    //calculate P&L and push
    return returnData;
  }

  async getOpening(startDate: Date): Promise<JournalEntry> {
    let startDateObj = moment("01-" + (startDate.getMonth() + 1) + "-" + startDate.getFullYear() + " 08:00:00", "DD-MM-YYYY hh:mm:ss").startOf('day');

    let openingEntry = await this.journalEntryModel.findOne({ isOpening: true, entryDate: { $gte: startDateObj.toDate() } });
    if (!openingEntry) {

      return this.createMonthOpeningBalance(startDate);
    }
    else {
      return openingEntry;
    }
  }

  async getTrialBalanceData(startDate: string, endDate: string) {
    //get all account items ordered by internal Type and account code
    let allAccountResult = await this.accountItemService.getfilters({});
    //hard coded chart of accounts for now
    let chartofAccounts = ["CURRENT ASSETS", "FIXED ASSETS", "CURRENT LIABILITIES", "LONG TERM LIABILITIES", "CAPITAL", "INCOME", "OTHER INCOME", "COGS", "EXPENSES"];

    let allAccountData = [];
    for (let i = 0; i < chartofAccounts.length; i++) {
      for (let j = 0; j < allAccountResult[0].length; j++) {
        if (allAccountResult[0][j].internalType == chartofAccounts[i]) {
          allAccountData.push(allAccountResult[0][j]);
        }
      }
    }


    //
    let openingBalanceItems = await this.getOpening(new Date(startDate));
    let journalItems = await this.getAllJournalItemsWithAccountId(startDate, endDate);
    let trialBalanceData = [];
    //console.log(openingBalanceItems);
    for (let i = 0; i < allAccountData.length; i++) {

      let accountItem = {
        id: allAccountData[i]._id,
        accountType: allAccountData[i].internalType,
        accountCode: allAccountData[i].accountCode,
        accountName: allAccountData[i].accountName,
        debit: 0,
        credit: 0,
        balance: 0
      }
      //search opening
      for (let j = 0; j < openingBalanceItems.journalItems.length; j++) {

        if (openingBalanceItems.journalItems[j].account == allAccountData[i]._id.toString() && openingBalanceItems.journalItems[j].name.toLowerCase().includes("opening")) {
          let debit = openingBalanceItems.journalItems[j].debit ? Math.round(openingBalanceItems.journalItems[j].debit.valueOf() * 100) / 100 : 0;
          let credit = openingBalanceItems.journalItems[j].credit ? Math.round(openingBalanceItems.journalItems[j].credit.valueOf() * 100) / 100 : 0;
          accountItem.debit += debit;
          accountItem.credit += credit;
          accountItem.balance += debit - credit;
        }
      }

      //search journalItems
      for (let j = 0; j < journalItems.length; j++) {
        let jItem: any = journalItems[j];
        if (jItem.account == allAccountData[i]._id.toString()) {
          for (let k = 0; k < jItem.journalItem.length; k++) {
            let debit = jItem.journalItem[k].debit ? Math.round(jItem.journalItem[k].debit * 100) / 100 : 0;
            let credit = jItem.journalItem[k].credit ? Math.round(jItem.journalItem[k].credit * 100) / 100 : 0;
            accountItem.debit += debit;
            accountItem.credit += credit;
            accountItem.balance += debit - credit;
          }
        }
      }
      trialBalanceData.push(accountItem);
    }

    //clean up annd set titles
    let startDateStr = moment(startDate).format("DD MMM YYYY");
    let endDateStr = moment(endDate).format("DD MMM YYYY");
    let finalTrialData = [];
    finalTrialData.push({
      accountCode: "Start Date",
      accountName: startDateStr,
      debit: "",
      credit: "End Date",
      balance: endDateStr
    });

    let currentType = "";
    let headingPosition = 1;
    let headingDebit = 0;
    let headingCredit = 0;
    let headingBalance = 0;
    for (let i = 0; i < trialBalanceData.length; i++) {
      if (trialBalanceData[i].accountType != currentType) {
        if (headingBalance != 0) {
          finalTrialData[headingPosition].debit = headingDebit;
          finalTrialData[headingPosition].credit = headingCredit;
          finalTrialData[headingPosition].balance = headingBalance;
        }
        headingPosition = finalTrialData.length;
        headingDebit = 0;
        headingCredit = 0;
        headingBalance = 0;
        finalTrialData.push({
          accountCode: trialBalanceData[i].accountType,
          accountName: "",
          debit: 0,
          credit: 0,
          balance: 0
        });
        currentType = trialBalanceData[i].accountType;
      }
      if (trialBalanceData[i].balance != 0) {
        headingDebit += trialBalanceData[i].debit;
        headingCredit += trialBalanceData[i].credit;
        headingBalance += trialBalanceData[i].balance;
        finalTrialData.push(trialBalanceData[i]);
      }

    }
    //last heading
    if (headingBalance > 0) {
      finalTrialData[headingPosition].debit = headingDebit;
      finalTrialData[headingPosition].credit = headingCredit;
      finalTrialData[headingPosition].balance = headingBalance;
    }

    return finalTrialData;
  }

  async removeJournalEntryWithModelId (opId: string): Promise<any>{
    const response = await this.journalEntryModel.deleteOne({ modelId: opId })

    console.log('JounalEntryRemoved Removed if any', response);

    return response
  }
}
