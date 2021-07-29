import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  NotFoundException,
  Param,
  Patch,
  Post,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FilterDto } from 'src/shared/filter.dto';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { DateAndAccount, DateDto } from './dto/date.dto';
import { UpdateJournalEntryDto } from './dto/update-journal-entry.dto';
import { JournalEntry } from './journal-entry.interface';
import { JournalEntryService } from './journal-entry.service';
import fs = require('fs-extra');
import path = require('path');
import { Response } from 'express';
const {
  parseAsync,
  Parser,
  transforms: { unwind },
} = require('json2csv');
@ApiTags('Journal-Entry')
@Controller('journal-entry')
export class JournalEntryController {
  constructor(private journalEntryService: JournalEntryService) {}

  @Post()
  async createJournalEntry(
    @Body() createJournalEntryDto: CreateJournalEntryDto,
  ): Promise<JournalEntry> {
    return await this.journalEntryService.create(createJournalEntryDto);
  }

  @Post('getfilters')
  async getfilters(@Body() query: FilterDto) {
    const result = await this.journalEntryService.getfilters(query);
    return result;
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.journalEntryService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateJournalEntryDto: UpdateJournalEntryDto,
  ): Promise<JournalEntry> {
    return await this.journalEntryService.update(id, updateJournalEntryDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.journalEntryService.remove(id);
  }

  @Get('/removeAllJournalEntryBySoNumber/:soNumber')
  async removeAllJournalEntryBySoNumber(@Param('soNumber') soNumber: string) {
    return await this.journalEntryService.removeAllJournalEntryBySoNumber(
      soNumber,
    );
  }

  
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename=journalEntry.csv')
  @Post('getJournalWithDate')
  async getJournalWithDate(@Body() query:DateDto,@Res() response: Response,){
    const res=await this.journalEntryService.getJournalWithDate(query)
    console.log('res',res)
    const fields=[
      'journlEntrynum',
      'reference',
      'date',
      'remarks',
      'totalDebit',
      'totalCredit',
      'journalItem.reference',
      'journalItem.name',
      'journalItem.partner',
      'JournalItemAccountName',
      'journalItem.debit',
      'journalItem.credit',
      'journalItem.amountCurrency',
      'journalItemCurrencyName'
    ]
    const opts={fields}

    if(res.length>0){
      const json2csvParser = new Parser(opts);
      const resultCSV = json2csvParser.parse(res);

      const readFile = fs.readFileSync(
        path.resolve('src/journal-entry/templates', 'journalEntry.csv'),
      );

      fs.writeFile(readFile, resultCSV, function (error) {
        if (error) {
          console.error(error);
        }
        console.log('successfully!');
        response.status(200).end(resultCSV);
      });
    } else {
      throw new NotFoundException('JournalEntry not Found');
    }
  }

  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename=journalEntry.csv')
  @Post('getJournalWithDateAndAccount')
  async getJournalWithDateAndAccount(@Body() query:DateAndAccount,@Res() response: Response,){
    const res=await this.journalEntryService.getJournalWithDateAndAccount(query)
    const fields=[
      'journlEntrynum',
      'reference',
      'date',
      'remarks',
      'debit',
      'credit',
      'balanceLeft',
      'journalItem.reference',
      'journalItem.name',
      'journalItem.partner',
      'JournalItemAccountName',
      'journalItem.amountCurrency',
      'journalItemCurrencyName'
    ]
    const opts={fields}

    if(res.length>0){
      const json2csvParser = new Parser(opts);
      const resultCSV = json2csvParser.parse(res);

      const readFile = fs.readFileSync(
        path.resolve('src/journal-entry/templates', 'journalEntry.csv'),
      );

      fs.writeFile(readFile, resultCSV, function (error) {
        if (error) {
          console.error(error);
        }
        console.log('successfully!');
        response.status(200).end(resultCSV);
      });
    } else {
      throw new NotFoundException('JournalEntry not Found');
    }
  }
}
