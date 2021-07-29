import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
  InternalServerErrorException,
  Res,
  Header,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { Invoice } from './interfaces/invoices.interface';
import { FilterDto } from 'src/shared/filter.dto';
import { ValidateObjectId } from '../shared/validate-object-id.pipes';
import { Response } from 'express';

import pdf = require('html-pdf');
import ejs = require('ejs');
import path = require('path');
import fs = require('fs-extra');
import { printPdfOptions } from '../shared/printPdfOptions';
import { Stream } from 'stream';
import { PdfDto } from 'src/reports/dto/pdf.dto';
const {
  parseAsync,
  Parser,
  transforms: { unwind },
} = require('json2csv');
@ApiTags('Invoice')
@Controller('invoices')
export class InvoicesController {
  constructor(private invoiceService: InvoicesService) { }

  // Create new invoice
  @Post()
  async createNewInvoice(
    @Body() createInvoiceDto: CreateInvoiceDto,
  ): Promise<Invoice> {
    return await this.invoiceService.createNewInvoice(createInvoiceDto);
  }

  // Fill All Invoices
  @Get('all')
  async findAll() {
    const result = await this.invoiceService.findAll();
    if (result.length < 1) {
      throw new NotFoundException('Invoice is empty');
    }
    return result;
  }

  // Find All + Filtered
  @Post('getfilters')
  async getfilters(@Body() query: FilterDto) {
    const result = await this.invoiceService.getfilters(query);
    return result;
  }

  @Get('/dropdown-group')
  async findAllDrop() {
    const result = await this.invoiceService.findAllInvoiceDropdownGroup();
    return result;
  }

  // Find Single invoice
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Invoice> {
    const result = await this.invoiceService.findOne(id);
    if (!result) {
      console.log('invoice not found');
      throw new NotFoundException('invoice not found!');
    }
    return result;
  }

  // Update Single invoice
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
  ) {
    const updatedInvoice = await this.invoiceService.update(
      id,
      updateInvoiceDto,
    );

    if (!updatedInvoice) {
      throw new InternalServerErrorException('invoice failed to update!');
    }
    return updatedInvoice;
  }

  // Delete Single invoice
  @Delete(':id')
  remove(@Param('id') id: string): Promise<any> {
    return this.invoiceService.removeOne(id);
  }

  async getSalesOrder(id: string): Promise<Invoice> {
    const result = this.invoiceService.getInvoice(id);
    if (!result) {
      throw new NotFoundException('invoice not found!!');
    }
    return result;
  }

  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename=ProfomaInvoice.pdf')
  @Get('/proforma-invoice-print-Pdf/:id')
  async getProfomaInvoicePdf(
    @Param('id', new ValidateObjectId()) id: string,
    @Res() response: Response,
  ) {
    const invoicePayload = await this.invoiceService.getProfomaInvoicePdf(id);
    const layoutHtml = fs.readFileSync(
      path.resolve('./src/invoices/template', 'proformaInvoice.ejs'),
      'utf8',
    );
    const render = ejs.render(layoutHtml, {
      invoice: invoicePayload,
    });

    const options = printPdfOptions();

    // const pdf = path.join(__dirname, '../../public', 'business.pdf');
    // return fs.createReadStream(pdf);

    pdf.create(render, options).toStream((err: any, stream: any) => {
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
  @Header('Content-Disposition', 'attachment; filename=TaxInvoice.pdf')
  @Get('/tax-invoice-print-Pdf/:id')
  async getTaxInvoicePdf(
    @Param('id', new ValidateObjectId()) id: string,
    @Res() response: Response,
  ) {
    const invoicePayload = await this.invoiceService.getTaxInvoicePdf(id);

    const layoutHtml = fs.readFileSync(
      path.resolve('./src/invoices/template', 'taxInvoice.ejs'),
      'utf8',
    );
    const render = ejs.render(layoutHtml, {
      invoice: invoicePayload,
    });

    const options = printPdfOptions();

    // const pdf = path.join(__dirname, '../../public', 'business.pdf');
    // return fs.createReadStream(pdf);

    pdf.create(render, options).toStream((err: any, stream: any) => {
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
  @Header('Content-Disposition', 'attachment; filename=commercialInvoice.pdf')
  @Get('/commercial-invoice-print-Pdf/:id')
  async getCommercialInvoicePdf(
    @Param('id', new ValidateObjectId()) id: string,
    @Res() response: Response,
  ) {
    const invoicePayload = await this.invoiceService.getCommercialInvoicePdf(
      id,
    );

    const layoutHtml = fs.readFileSync(
      path.resolve('./src/invoices/template', 'commercialInvoice.ejs'),
      'utf8',
    );
    const render = ejs.render(layoutHtml, {
      invoice: invoicePayload,
    });

    const options = printPdfOptions();

    // const pdf = path.join(__dirname, '../../public', 'business.pdf');
    // return fs.createReadStream(pdf);

    pdf.create(render, options).toStream((err: any, stream: any) => {
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
  @Header('Content-Disposition', 'attachment; filename=invoice.csv')
  @Post('/invoice-csv')
  async getInvoiceCsv(@Body() query: PdfDto, @Res() response: Response): Promise<void> {
    let invoiceData = await this.invoiceService.getCsvInvoice(query);
    const fields = [
      'custNo',
      'custName',
      'date',
      'invoiceNumber',
      'soNumber',
      'currency',
      'gst',
      'total',
      'status',
      'grossProfit'
    ]
    const opts = { fields }
    if (invoiceData.length > 0) {
      const json2csvParser = new Parser(opts);
      const resultCSV = json2csvParser.parse(invoiceData);

      const readFile = fs.readFileSync(
        path.resolve('src/invoices/template', 'invoice.csv'),
      );

      fs.writeFile(readFile, resultCSV, function (error) {
        if (error) {
          console.error(error);
        }
        console.log('successfully!');
        response.status(200).end(resultCSV);
      });
    } else {
      throw new NotFoundException('Invoice not Found');
    }
  }

}
