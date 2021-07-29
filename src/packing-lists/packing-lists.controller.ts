import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  NotFoundException,
  Patch,
  Res,
  Header,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PackingList } from './packing-lists.interface';
import { SalesOrder } from 'src/sales-orders/interfaces/sales-orders.interface';
import { PackingListsService } from './packing-lists.service';
import { PayloadPackingListDto } from './dto/payload-packing-list.dto';
// import { UpdatePackingListAddDto } from './dto/update-packing-list-add.dto';
import { CreatePackingListDto } from './dto/create-packing-list.dto';
import { UpdatePackingListDto } from './dto/update-packing-list.dto';
import { WorkOrder } from 'src/work-orders/interfaces/work-orders.interface';
import { Response } from 'express';

import fs = require('fs-extra');
import path = require('path');
import ejs = require('ejs');
import pdf = require('html-pdf');
import {printPdfOptions} from '../shared/printPdfOptions';
import { FilterDto } from '../shared/filter.dto';
import { ValidateObjectId } from '../shared/validate-object-id.pipes';
// import { UpdatePackItemsDto } from './dto/update-pack-Items.dto';

@ApiTags('packing-lists')
@Controller('packing-lists')
export class PackingListsController {
  constructor(private readonly packingListsService: PackingListsService) {}

  @Post('create-packing/:deliveryId')
  async createPackingList(
    @Param('deliveryId') deliveryId: string,
  ): Promise<PackingList> {
    const result = await this.packingListsService.createPackingList(deliveryId);
    return result;
  }

  @Get()
  async findAll(): Promise<PackingList[]> {
    const result = await this.packingListsService.findAllPackingList();
    return result;
  }

  @Get('/:packingId')
  async findOnePackingList(
    @Param('packingId') packingId: string,
  ): Promise<PackingList> {
    const result = await this.packingListsService.findOnePackingList(packingId);
    if (!result) {
      throw new NotFoundException('PackingList ID does not exist!');
    }
    return result;
  }

  @Get('findSimplePackingList/:packingId')
  async getLeanPackingOrderById(
    @Param('packingId') packingId: string,
  ): Promise<PackingList> {
    const result = await this.packingListsService.getLeanPackingOrderById(
      packingId,
    );
    if (!result) {
      throw new NotFoundException('PackingList ID does not exist!');
    }
    return result;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePackingListDto,
  ): Promise<PackingList> {
    const result = await this.packingListsService.update(
      id,
      updatePackingListDto,
    );
    if (!result) {
      throw new NotFoundException('PackingList ID does not exist!');
    }
    return result;
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<PackingList> {
    return await this.packingListsService.remove(id);
  }

  @Get('findByWoId/:woId')
  async findByWoId(@Param('woId') woId: string): Promise<PackingList> {
    const result = await this.packingListsService.findByWoId(woId);
    if (!result) {
      throw new NotFoundException('PackingList does not exist!');
    }
    return result;
  }

  @Get('findByDoId/:DoId')
  async findByDoId(@Param('DoId') DoId: string): Promise<PackingList> {
    const result = await this.packingListsService.findByDoId(DoId);
    if (!result) {
      throw new NotFoundException('PackingList does not exist!');
    }
    return result;
  }

  @Post('getfilters')
  async getFilters(@Body() query: FilterDto) {
    return await this.packingListsService.getFilters(query);
  }

  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename=packinglist.pdf')
  @Get('/pdf/:id')
  async generatePDF(
    @Param('id', new ValidateObjectId()) id: string,
    @Res() res: Response,
  ): Promise<void> {
    const PackingList = await this.packingListsService.generatePDF(id);

    const layoutHtml = fs.readFileSync(
      path.resolve('./src/packing-lists/template', 'packing.ejs'),
      'utf8',
    );
    const render = ejs.render(layoutHtml, { data: PackingList });
    const options = printPdfOptions();
    pdf.create(render, options).toStream((err: any, stream: any) => {
      if (err) {
        res.status(500);
        res.end(JSON.stringify(err));

        return;
      }

      stream.pipe(res);
    });
  }

  @Header('Content-Type', 'application/pdf')
  @Header(
    'Content-Disposition',
    'attachment; filename=packingCommercialInvoice.pdf',
  )
  @Get('/packing-commercial-invoice-print-Pdf/:packingId')
  async getCommercialInvoicePdf(
    @Param('packingId', new ValidateObjectId()) packingId: string,
    @Res() response: Response,
  ) {
    const PackingCommercialPayload = await this.packingListsService.getCommercialInvoicePdf(
      packingId,
    );

    if (!PackingCommercialPayload) {
      throw new NotFoundException('Packing List Info Not Found');
    }

    const layoutHtml = fs.readFileSync(
      path.resolve('./src/packing-lists/template', 'packingComInvoice.ejs'),
      'utf8',
    );
    const render = ejs.render(layoutHtml, {
      data: PackingCommercialPayload,
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
}
