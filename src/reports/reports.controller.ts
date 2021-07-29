import { Controller, Get, Post, Body, Put, Param, Delete, Header, Res,  NotFoundException } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { Response } from 'express';

import fs = require('fs-extra');
import path = require('path');
import ejs = require('ejs');
import pdf = require('html-pdf');
import {printPdfOptions} from '../shared/printPdfOptions';
import { PdfDto } from './dto/pdf.dto';
import * as moment from 'moment';
import { ApiTags } from '@nestjs/swagger';
const {
  parseAsync,
  Parser,
  transforms: { unwind },
} = require('json2csv');

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  create(@Body() query:PdfDto) {
    return this.reportsService.generatePDF(query);
  }

  @Get()
  findAll() {
    return this.reportsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reportsService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateReportDto: UpdateReportDto) {
    return this.reportsService.update(+id, updateReportDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reportsService.remove(+id);
  }

  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename=generalledger.pdf')
  @Post('/generalledger-pdf')
  async generateGLPDF(
    @Body() query:PdfDto,
    @Res() response: Response,
  ): Promise<void> {
    const journalEntry = await this.reportsService.generatePDF(query);
    const layoutHtml = fs.readFileSync(
      path.resolve('./src/reports/template', 'generalledger.ejs'),
      'utf8',
    );
    let startDate = moment(query.startDate);
    let endDate = moment(query.endDate);
    const render = ejs.render(layoutHtml, { data: journalEntry, startDate: startDate.format("DD-MM-YYYY"), endDate: endDate.format("DD-MM-YYYY") });
    const options = printPdfOptions();
    pdf.create(render, options).toStream((err, stream) => {
      if (err) {
        console.error(err);
        response.status(500);
        response.end(JSON.stringify(err));

        return;
      }

      stream.pipe(response);
    });
  }

  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename=gst.pdf')
  @Post('/gst-pdf')
  async gstPDF(
    @Body() query:PdfDto,
    @Res() response: Response,
  ): Promise<void> {
    const journalEntry = await this.reportsService.gstReport(query);
    const layoutHtml = fs.readFileSync(
      path.resolve('./src/reports/template', 'generalledger.ejs'),
      'utf8',
    );
    let startDate = moment(query.startDate);
    let endDate = moment(query.endDate);
    const render = ejs.render(layoutHtml, { data: journalEntry, startDate: startDate.format("DD-MM-YYYY"), endDate: endDate.format("DD-MM-YYYY") });
    const options = printPdfOptions();
    pdf.create(render, options).toStream((err, stream) => {
      if (err) {
        console.error(err);
        response.status(500);
        response.end(JSON.stringify(err));

        return;
      }

      stream.pipe(response);
    });
  }

  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename=trialBalance.csv')
  @Post('/trial-balance')
  async getTrialBalance(
    @Body() query:PdfDto,
    @Res() response: Response,
  ): Promise <void> {
    let journalData = await this.reportsService.getTrialBalance(query);
    const fields=[
      'accountCode',
      'accountName',
      'debit',
      'credit',
      'balance'     
    ]
    console.log(journalData);
    const opts={fields}

    if(journalData.length>0){
      const json2csvParser = new Parser(opts);
      const resultCSV = json2csvParser.parse(journalData);

      const readFile = fs.readFileSync(
        path.resolve('src/reports/template', 'journalEntry.csv'),
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
  @Header('Content-Disposition', 'attachment; filename=profitnloss.csv')
  @Post('/profitnloss-report')
  async getPnlReport(
    @Body() query:PdfDto,
    @Res() response: Response,
  ): Promise <void> {
    let journalData = await this.reportsService.getPNLReport(query);
    const fields=[
      'column1',
      'column2',
      'column3',
      'column4'    
    ]
    const opts={fields, header: false}

    if(journalData.length>0){
      const json2csvParser = new Parser(opts);
      const resultCSV = json2csvParser.parse(journalData);

      const readFile = fs.readFileSync(
        path.resolve('src/reports/template', 'journalEntry.csv'),
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
  @Header('Content-Disposition', 'attachment; filename=balancesheet.csv')
  @Post('/balance-sheet')
  async getBalanceSheet(
    @Body() query:PdfDto,
    @Res() response: Response,
  ): Promise <void> {
    let journalData = await this.reportsService.getBalanceSheet(query);
    const fields=[
      'column1',
      'column2',
      'column3',
      'column4'    
    ]
    const opts={fields, header: false}

    if(journalData.length>0){
      const json2csvParser = new Parser(opts);
      const resultCSV = json2csvParser.parse(journalData);

      const readFile = fs.readFileSync(
        path.resolve('src/reports/template', 'journalEntry.csv'),
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
