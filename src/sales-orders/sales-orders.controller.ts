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
  BadRequestException,
  Res,
  Req,
  Header,
} from '@nestjs/common';

import { ValidateObjectId } from './../shared/validate-object-id.pipes';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SalesOrdersService } from './sales-orders.service';
import {
  CreateSalesOrderDto,
  CreateUploadData,
} from './dto/create-sales-order.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';
import { SalesOrder } from './interfaces/sales-orders.interface';
import { FilterDto } from 'src/shared/filter.dto';
import { Response, Request } from 'express';

import fs = require('fs-extra');
import path = require('path');
import ejs = require('ejs');
import pdf = require('html-pdf');
import {
  printPdfOptions,
  printPdfOptionsLandscape,
} from '../shared/printPdfOptions';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { User } from '../users/users.interface';
import * as moment from 'moment';
import { PdfDto } from 'src/reports/dto/pdf.dto';
const {
  parseAsync,
  Parser,
  transforms: { unwind },
} = require('json2csv');
@ApiTags('Sales-Order')
//@UseGuards(JwtAuthGuard)
@Controller('sales-orders')
export class SalesOrdersController {
  constructor(private salesOrdersService: SalesOrdersService) { }

  // Create new Sales Order
  @Post()
  async createNewSalesOrder(
    @Body() createSalesOrderDto: CreateSalesOrderDto,
  ): Promise<SalesOrder> {
    return await this.salesOrdersService.createNewSalesOrder(
      createSalesOrderDto,
    );
  }

  // Create New Version of sales order & Update Old Version
  @Post('/create-new-version/:id')
  async createNewVersion(
    @Param('id', new ValidateObjectId()) id: string,
  ): Promise<SalesOrder> {
    // Find Status
    const salesOrder = await this.salesOrdersService.findStatusById(id);

    if (!salesOrder) {
      throw new BadRequestException(
        'Sales order is not exist yet, kindly save this sales order',
      );
    }

    if (salesOrder && salesOrder.status === 'draft') {
      throw new BadRequestException(
        "You're currently in draft mode, you're not allow to create new version",
      );
    }

    if (salesOrder && salesOrder.latestSalesOrder === false) {
      throw new BadRequestException(
        'Previously, a new version of sales order has been created',
      );
    }

    // Create new Version
    const newCreatedVersion = await this.salesOrdersService.createNewVersion(
      salesOrder,
    );

    if (!newCreatedVersion) {
      throw new InternalServerErrorException(
        'Failed to create new version of sales order',
      );
    }

    // Update Old Version
    await this.salesOrdersService.updateOldVersion(id);

    //Return New SalesOrder
    return newCreatedVersion;
  }

  // Fill All Sales Orders, no longer in use
  // @Get()
  async findAll(): Promise<SalesOrder[]> {
    const result = await this.salesOrdersService.findAll();
    if (result.length < 1) {
      throw new NotFoundException('Sales order is empty');
    }
    return result;
  }

  // Find All + Filtered
  @Post('getfilters')
  async getfilters(@Body() query: FilterDto, @AuthUser() user: User) {
    const result = await this.salesOrdersService.getfilters(query, user);
    return result;
  }

  @Get('/dropdown-group')
  async findAllDrop(): Promise<any> {
    const result = await this.salesOrdersService.findAllSalesOrderDropdownGroup();
    return result;
  }

  // Find Single Sales Order
  @Get(':id')
  async findOne(
    @Param('id', new ValidateObjectId()) id: string,
  ): Promise<SalesOrder> {
    const result = await this.salesOrdersService.findOne(id);
    if (!result) {
      console.log('sales order not found');
      throw new NotFoundException('Sales order not found!');
    }

    return result;
  }

  // Update Single Sales Order
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSalesOrderDto: UpdateSalesOrderDto,
  ): Promise<SalesOrder> {
    const updatedSalesOrder = await this.salesOrdersService.update(
      id,
      updateSalesOrderDto,
    );

    if (!updatedSalesOrder) {
      throw new InternalServerErrorException('Sales order failed to update!');
    }
    return updatedSalesOrder;
  }

  @Patch('newRemark/:id')
  async updateRemark(
    @Param('id') id: string,
    @Body() updateSalesOrderDto: UpdateSalesOrderDto,
  ): Promise<SalesOrder> {
    const updateRemark = await this.salesOrdersService.updateNewRemark(
      id,
      updateSalesOrderDto,
    );
    if (!updateRemark) {
      throw new InternalServerErrorException(
        'Sales Order failed to update new remark!',
      );
    }
    return updateRemark;
  }

  // Delete Single Sales Order
  @Delete(':id')
  remove(@Param('id') id: string): Promise<any> {
    return this.salesOrdersService.removeOne(id);
  }

  // async getSoNumber(id: string): Promise<string> {
  //   const result = this.salesOrdersService.getSoNumber(id);
  //   if (!result) {
  //     throw new NotFoundException('Sales order not found!');
  //   }
  //   return result;
  // }

  async getSalesOrder(id: string): Promise<SalesOrder> {
    const result = this.salesOrdersService.getSalesOrder(id);
    if (!result) {
      throw new NotFoundException('Sales order not found!!');
    }
    return result;
  }

  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename=salesorder.pdf')
  @Get('/pdf/:id')
  async generatePdF(
    @Param('id', new ValidateObjectId()) id: string,
    @Res() response: Response,
  ): Promise<void> {
    const salesorder = await this.salesOrdersService.generatePdf(
      id,
      'saleorder',
    );

    console.log('what is salesOrder output', salesorder);

    const layoutHtml = fs.readFileSync(
      path.resolve('./src/sales-orders/templates', 'salesorder.ejs'),
      'utf8',
    );
    const render = ejs.render(layoutHtml, {
      data: salesorder,
    });
    const options = printPdfOptions();
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
  @Header('Content-Disposition', 'attachment; filename=salesorderAll.pdf')
  @Get('/AllSaleOrder/pdf')
  async generateSaleOrdersAllPdF(@Res() response: Response): Promise<void> {
    const salesorder = await this.salesOrdersService.generateAllSaleOrderPdf();

    console.log('what is salesOrder output', salesorder);

    const layoutHtml = fs.readFileSync(
      path.resolve('./src/sales-orders/templates', 'salesorderlist.ejs'),
      'utf8',
    );
    const render = ejs.render(layoutHtml, {
      data: salesorder,
      moment: moment,
    });
    const options = printPdfOptionsLandscape();
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
  @Header('Content-Disposition', 'attachment; filename=salesorderAll.pdf')
  @Post('/AllSaleOrder/pdf')
  async generateSaleOrdersAllPdFWithDate(@Body() query: PdfDto, @Res() response: Response): Promise<void> {
    const salesorder = await this.salesOrdersService.generateAllSaleOrderPdfWithDate(query);

    console.log('what is salesOrder output', salesorder);

    const layoutHtml = fs.readFileSync(
      path.resolve('./src/sales-orders/templates', 'salesorderlist.ejs'),
      'utf8',
    );
    const render = ejs.render(layoutHtml, {
      data: salesorder,
      moment: moment,
    });
    const options = printPdfOptionsLandscape();
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
  @Header('Content-Disposition', 'attachment; filename=backsorderAll.pdf')
  @Get('/AllBackOrder/pdf')
  async generateBackOrdersAllPdF(@Res() response: Response): Promise<void> {
    const salesorder = await this.salesOrdersService.generateAllBackOrderPdf();

    console.log('what is salesOrder output', salesorder);

    const layoutHtml = fs.readFileSync(
      path.resolve('./src/sales-orders/templates', 'backorderlist.ejs'),
      'utf8',
    );
    const render = ejs.render(layoutHtml, {
      data: salesorder,
      moment: moment,
    });
    const options = printPdfOptionsLandscape();
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
  @Header('Content-Disposition', 'attachment; filename=backsorderAll.pdf')
  @Post('/AllBackOrder/pdf')
  async generateBackOrdersAllPdFUpload(
    @Res() response: Response,
    @Body() createUploadData: CreateUploadData,
  ): Promise<void> {
    const salesorder = await this.salesOrdersService.generateAllBackOrderPdf();
    console.log('createUploadData', createUploadData);
    console.log('what is salesOrder output', salesorder);

    const layoutHtml = fs.readFileSync(
      path.resolve('./src/sales-orders/templates', 'backorderlist.ejs'),
      'utf8',
    );
    const render = ejs.render(layoutHtml, {
      data: salesorder,
      moment: moment,
    });
    const options = printPdfOptionsLandscape();
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

  // FOR OC STUFF
  @Patch('/updateSimpleByAdmin/:id')
  async updateSimpleForAdmin(
    @Param('id') id: string,
    @Body() updateSalesOrderDto: UpdateSalesOrderDto,
  ): Promise<SalesOrder> {
    const updatedSalesOrder = await this.salesOrdersService.updateSimpleByAdmin(
      id,
      updateSalesOrderDto,
    );

    if (!updatedSalesOrder) {
      throw new InternalServerErrorException('Sales order failed to update!');
    }
    return updatedSalesOrder;
  }

  @Get('/findSoAndWORestriction/:id')
  async findSoAndWORestriction(
    @Param('id', new ValidateObjectId()) id: string,
  ): Promise<SalesOrder> {
    const result = await this.salesOrdersService.findSoAndWORestriction(id);
    if (!result) {
      console.log('sales order not found');
      throw new NotFoundException('Sales order not found!');
    }

    return result;
  }

  @Delete('/removeSOandWO/:id')
  async removeSOandWO(
    @Param('id', new ValidateObjectId()) id: string,
  ): Promise<any> {
    // Find and Validate Restriction first
    const response = await this.findSoAndWORestriction(id);

    if (response) {
      console.log('Proceed in remove SO and WO');
      return await this.salesOrdersService.removeSOandWO(id);
    } else {
      throw new BadRequestException('Not Allow to Remove');
    }
  }

  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename=saleOrders.csv')
  @Get()
  async findAllToExportCSV(@Res() response: Response) {
    const saleOrder = await this.salesOrdersService.findAllSaleOrderExportCSV();
    console.log('sale', saleOrder);
    const fields = [
      'soNumber',
      'versionNum',
      'date',
      'custName',
      'total',
      'status',
      'woStatus',
      'doStatus',
    ];
    const opts = { fields };
    if (saleOrder.length > 0) {
      const json2csvParser = new Parser(opts);
      const resultCSV = json2csvParser.parse(saleOrder);

      const readFile = fs.readFileSync(
        path.resolve('src/sales-orders/templates', 'saleOrder.csv'),
      );

      fs.writeFile(readFile, resultCSV, function (error) {
        if (error) {
          console.error(error);
        }
        console.log('successfully!');
        response.status(200).end(resultCSV);
      });
    } else {
      throw new NotFoundException('SaleOrder not Found');
    }
  }

  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename=saleOrders.csv')
  @Post('/saleOrderCsv')
  async findAllToExportCSVWithDate(@Body() query: PdfDto, @Res() response: Response) {
    const saleOrder = await this.salesOrdersService.findAllSaleOrderExportCSVWithDate(query);
    console.log('sale', saleOrder);
    const fields = [
      'soNumber',
      'versionNum',
      'date',
      'custName',
      'total',
      'status',
      'woStatus',
      'doStatus',
    ];
    const opts = { fields };
    if (saleOrder.length > 0) {
      const json2csvParser = new Parser(opts);
      const resultCSV = json2csvParser.parse(saleOrder);

      const readFile = fs.readFileSync(
        path.resolve('src/sales-orders/templates', 'saleOrder.csv'),
      );

      fs.writeFile(readFile, resultCSV, function (error) {
        if (error) {
          console.error(error);
        }
        console.log('successfully!');
        response.status(200).end(resultCSV);
      });
    } else {
      throw new NotFoundException('SaleOrder not Found');
    }
  }

  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename=backOrders.csv')
  @Get('/backOrder/csv')
  async findAllBackOrderToExportCSV(@Res() response: Response): Promise<void> {
    const backOrder = await this.salesOrdersService.findAllBackOrderExportCSV();
    const fields = [
      'soNumber',
      'versionNum',
      'date',
      'custName',
      'total',
      'status',
      'woStatus',
      'doStatus',
    ];
    const opts = { fields };
    if (backOrder.length > 0) {
      const json2csvParser = new Parser(opts);
      const resultCSV = json2csvParser.parse(backOrder);

      const readFile = fs.readFileSync(
        path.resolve('src/sales-orders/templates', 'saleOrder.csv'),
      );

      fs.writeFile(readFile, resultCSV, function (error) {
        if (error) {
          console.error(error);
        }
        console.log('successfully!');
        response.status(200).end(resultCSV);
      });
    } else {
      throw new NotFoundException('BackOrder not Found');
    }
  }

  @ApiOperation({
    description:
      'ALERT: This API will Reset entire WorkOrder till jounalEntries documents.',
  })
  @Patch('/findOneHardReset/:salesOrderId')
  async findOneHardReset(
    @Param('salesOrderId') salesOrderId: string,
  ): Promise<SalesOrder> {
    const updatedSalesOrder = await this.salesOrdersService.findOneHardReset(
      salesOrderId,
    );

    if (!updatedSalesOrder) {
      throw new NotFoundException('Sales order not found!');
    }
    return updatedSalesOrder;
  }

  @ApiOperation({
    description:
      'ALERT: This API will Reset entire WorkOrder. WorOrder must not has any completed items',
  })
  @Patch('/resetWorkOrderOnly/:salesOrderId')
  async resetWorkOrderOnly(
    @Param('salesOrderId') salesOrderId: string,
  ): Promise<SalesOrder> {
    const updatedSalesOrder = await this.salesOrdersService.resetWorkOrderOnly(
      salesOrderId,
    );

    if (!updatedSalesOrder) {
      throw new NotFoundException('Sales order not found!');
    }
    return updatedSalesOrder;
  }

  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename=CommercialInvoice.pdf')
  @Get('/commercial-invoice-print-Pdf/:salesOrderId')
  async getCommercialInvoicePdf(
    @Param('salesOrderId', new ValidateObjectId()) salesOrderId: string,
    @Res() response: Response,
  ) {
    const payload = await this.salesOrdersService.generatePdf(
      salesOrderId,
      'commercial',
    );

    const layoutHtml = fs.readFileSync(
      path.resolve('./src/sales-orders/templates', 'salesorder.ejs'),
      'utf8',
    );
    const render = ejs.render(layoutHtml, {
      data: payload,
    });

    const options = printPdfOptions();

    // const pdf = path.join(__dirname, '../../public', 'business.pdf');
    // return fs.createReadStream(pdf);

    pdf.create(render, options).toStream((err: any, stream: any) => {
      if (err) {
        response.status(500);
        response.end(JSON.stringify(err));

        return;
      }

      stream.pipe(response);
    });
  }

  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename=ProfomaInvoice.pdf')
  @Get('/proforma-invoice-print-Pdf/:id')
  async getProfomaInvoicePdf(
    @Param('id', new ValidateObjectId()) id: string,
    @Res() response: Response,
  ) {
    const payload = await this.salesOrdersService.generatePdf(id, 'proforma');
    const layoutHtml = fs.readFileSync(
      path.resolve('./src/sales-orders/templates', 'salesorder.ejs'),
      'utf8',
    );
    const render = ejs.render(layoutHtml, {
      data: payload,
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
}
