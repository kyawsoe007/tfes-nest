import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  NotFoundException,
  Patch,
  InternalServerErrorException,
  Res,
  Header,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreatePurchaseDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseDto } from './dto/update-purchase-order.dto';
import { Purchase } from './purchase-order.interface';
import { FilterDto } from 'src/shared/filter.dto';
import { PurchasesService } from './purchase-order.service';
import { Response } from 'express';

import fs = require('fs-extra');
import path = require('path');
import ejs = require('ejs');
import pdf = require('html-pdf');
import {
  printPdfOptions,
  printPdfOptionsLandscape,
} from '../shared/printPdfOptions';
import { User } from '../users/users.interface';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import * as moment from 'moment';
import { CreatePurchaseBySelectionDto } from './dto/create-by-selection-purchase-order.dto';
import { PurchaseListTemp } from '../purchase-list-temp/purchase-list-temp.interface';
import { PdfDto } from 'src/reports/dto/pdf.dto';
const {
  parseAsync,
  Parser,
  transforms: { unwind },
} = require('json2csv');

@ApiTags('Purchase')
@Controller('purchase')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) { }

  // Create new Purchase
  @Post()
  async create(@Body() createPurchaseDto: CreatePurchaseDto) {
    return await this.purchasesService.create(createPurchaseDto);
  }

  // Update old and Create New Version of Purchase
  @Post('/create-new-version/:id')
  async createNewVersion(@Param('id') id: string) {
    // Find Status
    const purchase = await this.purchasesService.findStatusById(id);

    if (!purchase) {
      throw new InternalServerErrorException(
        'Failed to update Original Version!',
      );
    }

    // Create new Version
    const newPurchase = await this.purchasesService.createNewVersionPurchase(
      purchase,
    );

    // if (!newPurchase) {
    //     throw new InternalServerErrorException(
    //         'Failed to create new version of purchase'
    //     );
    // }

    // Update Old Version
    await this.purchasesService.updatePurchaseStatus(id);

    return newPurchase;
  }

  //@Get()
  async findAll() {
    const result = await this.purchasesService.findAll();
    return result;
  }

  @Post('getfilters')
  async getfilters(@Body() query: FilterDto) {
    const result = await this.purchasesService.getfilters(query);
    return result;
  }
  // Fetch all dropdown group belongs to purchase page
  @Get('dropdown-group')
  async getAllPurchaseDropdownGroup() {
    const result = await this.purchasesService.getAllPurchaseDropdownGroup();
    return result;
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @AuthUser() user: User,
  ): Promise<Purchase> {
    const result = await this.purchasesService.findOne(id, user);
    if (!result) {
      throw new NotFoundException('Purchase not found!');
    }
    return result;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @AuthUser() user: User,
    @Body() updatePurchaseDto: UpdatePurchaseDto,
  ): Promise<Purchase> {
    console.log('update', id, updatePurchaseDto)
    const updatedPurchase = await this.purchasesService.update(
      id,
      user,
      updatePurchaseDto,
    );

    if (!updatedPurchase) {
      throw new InternalServerErrorException('Purchase Failed to update!');
    }
    return updatedPurchase;
  }

  @Patch('newRemark/:id')
  async updateNewRemark(
    @Param('id') id: string,
    @Body() updatePurchaseDto: UpdatePurchaseDto,
  ): Promise<Purchase> {
    const updatedPurchase = await this.purchasesService.updateNewRemark(
      id,
      updatePurchaseDto,
    );

    if (!updatedPurchase) {
      throw new InternalServerErrorException(
        'Purchase Failed to update new remark!',
      );
    }
    return updatedPurchase;
  }

  @Patch('/update-purchase-convert-status/:id')
  async updateConvertStatus(id: string) {
    return await this.purchasesService.updateConvertStatus(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<any> {
    return this.purchasesService.remove(id);
  }

  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename=purchaseOrder.pdf')
  @Get('/pdf/:id')
  async generatePDF(
    @Param('id') id: string,
    @Res() response: Response,
  ): Promise<void> {
    const purchase = await this.purchasesService.generatePDF(id);
    const layoutHtml = fs.readFileSync(
      path.resolve('./src/purchase-order/template', 'purchaseorder.ejs'),
      'utf8',
    );
    const render = ejs.render(layoutHtml, { data: purchase });
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
  @Header('Content-Disposition', 'attachment; filename=purchaseOrdersList.pdf')
  @Get('/AllPurchaseOrder/pdf')
  async generateAllPurchaseOrderPDF(@Res() response: Response): Promise<void> {
    const purchase = await this.purchasesService.generateAllPurchasePdf();
    const layoutHtml = fs.readFileSync(
      path.resolve('./src/purchase-order/template', 'purchaseorderlist.ejs'),
      'utf8',
    );
    const render = ejs.render(layoutHtml, { data: purchase, moment: moment });
    const options = printPdfOptionsLandscape();
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
  @Header('Content-Disposition', 'attachment; filename=purchaseOrdersList.pdf')
  @Post('/AllPurchaseOrder/pdf')
  async generateAllPurchaseOrderPDFWithDate(@Body() query: PdfDto, @Res() response: Response): Promise<void> {
    const purchase = await this.purchasesService.generateAllPurchasePdfWithDate(query);
    const layoutHtml = fs.readFileSync(
      path.resolve('./src/purchase-order/template', 'purchaseorderlist.ejs'),
      'utf8',
    );
    const render = ejs.render(layoutHtml, { data: purchase, moment: moment });
    const options = printPdfOptionsLandscape();
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

  // FOR OC STUFF
  @Patch('/updateSimpleByAdmin/:id')
  async updateSimpleForAdmin(
    @Param('id') id: string,
    @Body() updatePurchaseDto: UpdatePurchaseDto,
  ): Promise<Purchase> {
    const response = await this.purchasesService.updateSimpleByAdmin(
      id,
      updatePurchaseDto,
    );

    if (!response) {
      throw new InternalServerErrorException('Purchase failed to update!');
    }
    return response;
  }

  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename=purchases.csv')
  @Get()
  async findAllToExportCSV(@Res() response: Response) {
    const purchaseOrder = await this.purchasesService.findAllToExportCSV();

    const fields = [
      'poNumber',
      'purchaseType',
      'date',
      'name',
      'suppNo',
      'purchasePic.firstName',
      'purchasePic.lastName',
      'delAddress',
      'currency.name',
      'total',
      'status',
    ];
    const opts = { fields };
    if (purchaseOrder.length > 0) {
      const json2csvParser = new Parser(opts);
      const resultCSV = json2csvParser.parse(purchaseOrder);
      const readFile = fs.readFileSync(
        path.resolve('src/purchase-order/template', 'purchase.csv'),
      );

      fs.writeFile(readFile, resultCSV, function (error) {
        if (error) {
          console.error(error);
        }
        console.log('successfully!');
        response.status(200).end(resultCSV);
      });
    } else {
      throw new NotFoundException('Purchase Order not Found');
    }
  }

  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename=purchases.csv')
  @Post('/purchaseOrderCsv')
  async findAllToExportCSVWithDate(@Body() query: PdfDto, @Res() response: Response) {
    const purchaseOrder = await this.purchasesService.findAllToExportCSVWithDate(query);

    const fields = [
      'poNumber',
      'purchaseType',
      'date',
      'name',
      'suppNo',
      'purchasePic.firstName',
      'purchasePic.lastName',
      'delAddress',
      'currency.name',
      'total',
      'status',
    ];
    const opts = { fields };
    if (purchaseOrder.length > 0) {
      const json2csvParser = new Parser(opts);
      const resultCSV = json2csvParser.parse(purchaseOrder);
      const readFile = fs.readFileSync(
        path.resolve('src/purchase-order/template', 'purchase.csv'),
      );

      fs.writeFile(readFile, resultCSV, function (error) {
        if (error) {
          console.error(error);
        }
        console.log('successfully!');
        response.status(200).end(resultCSV);
      });
    } else {
      throw new NotFoundException('Purchase Order not Found');
    }
  }

  @Post('/createBySelection/')
  async createBySelection(
    @Body() createPurchaseBySelectionDto: CreatePurchaseBySelectionDto,
    @AuthUser() user: User,
  ): Promise<PurchaseListTemp[]> {
    return await this.purchasesService.createBySelection(
      createPurchaseBySelectionDto,
      user,
    );
  }
}
