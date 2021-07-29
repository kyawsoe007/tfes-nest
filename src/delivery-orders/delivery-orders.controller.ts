import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  InternalServerErrorException,
  Header,
  Res,
} from '@nestjs/common';

import { DeliveryOrdersService } from './delivery-orders.service';
import { DeliveryOrder } from './delivery-orders.interface';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateDeliveryOrderDto } from './dto/create-delivery-order.dto';
import { UpdateAllDeliveryOrderDto } from './dto/update-all-delivery-order.dto';
import { FilterDto } from '../shared/filter.dto';
import { Response } from 'express';

import fs = require('fs-extra');
import path = require('path');
import ejs = require('ejs');
import pdf = require('html-pdf');
import { printPdfOptions } from '../shared/printPdfOptions';
import { ValidateObjectId } from '../shared/validate-object-id.pipes';
import { UpdateDeliveryOrderDto } from './dto/update-delivery-order.dto';

@ApiTags('delivery-orders')
@Controller('delivery-orders')
export class DeliveryOrdersController {
  constructor(private readonly deliveryOrdersService: DeliveryOrdersService) {}

  @Post('create-new-based-selection')
  createNewBasedSelection(
    @Body() createDeliveryOrderDto: CreateDeliveryOrderDto,
  ) {
    return this.deliveryOrdersService.createNewBasedSelection(
      createDeliveryOrderDto,
    );
  }

  @Get()
  findAll() {
    return this.deliveryOrdersService.findAllDeliveryOrder();
  }

  @Get(':id')
  findOne(
    @Param('id', new ValidateObjectId()) id: string,
  ): Promise<DeliveryOrder> {
    return this.deliveryOrdersService.findOneDeliveryOrder(id);
  }

  @Patch('update-all-delivery-order/:id')
  async updateAllDeliverOrder(
    @Param('id', new ValidateObjectId()) id: string,
    @Body() updateAllDeliveryOrderDto: UpdateAllDeliveryOrderDto,
  ): Promise<DeliveryOrder> {
    const result = await this.deliveryOrdersService.updateAllDeliverOrder(
      id,
      updateAllDeliveryOrderDto,
    );

    if (!result) {
      throw new InternalServerErrorException(
        'Failed to update delivery order!',
      );
    }
    return result;
  }

  @ApiOperation({
    description:
      'ALERT: Delete a delivery Order will also delete deliveryWorkItems and packinglist document',
  })
  @Delete(':deliveryOrderId')
  remove(@Param('deliveryOrderId') deliveryOrderId: string) {
    return this.deliveryOrdersService.removeDeliveryOrder(deliveryOrderId);
  }

  @Post('getfilters')
  async getFilters(@Body() query: FilterDto) {
    return await this.deliveryOrdersService.getFilters(query);
  }

  @Patch('update-delivery-order/:id')
  async updateDeliverOrderById(
    @Param('id', new ValidateObjectId()) id: string,
    @Body() updateDeliveryOrderDto: UpdateDeliveryOrderDto,
  ): Promise<DeliveryOrder> {
    const result = await this.deliveryOrdersService.updateDeliverOrderById(
      id,
      updateDeliveryOrderDto,
    );

    if (!result) {
      throw new InternalServerErrorException(
        'Failed to update delivery order!',
      );
    }
    return result;
  }

  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename=deliveryOrder.pdf')
  @Get('/pdf/:id')
  async generatePdF(
    @Param('id', new ValidateObjectId()) id: string,
    @Res() response: Response,
  ): Promise<void> {
    const deliveryOrder = await this.deliveryOrdersService.generatePdf(id);

    const layoutHtml = fs.readFileSync(
      path.resolve('./src/delivery-orders/templates', 'deliveryOrder.ejs'),
      'utf8',
    );
    const render = ejs.render(layoutHtml, {
      data: deliveryOrder,
    });
    const options = printPdfOptions();
    pdf.create(render, options).toStream((err: any, stream: any) => {
      if (err) {
        console.error(err);
        response.status(500);
        response.end(JSON.stringify(err));

        return;
      }

      response.setHeader('Content-type', 'application/pdf');
      response.setHeader(
        'Content-Disposition',
        'attachment; filename=deliveryOrder.pdf',
      );

      stream.pipe(response);
    });
  }

  @Get('/findAllDobyWoId/:workOrderId')
  findAllDeliverOrderByWoId(
    @Param('workOrderId', new ValidateObjectId()) workOrderId: string,
  ): Promise<DeliveryOrder[]> {
    return this.deliveryOrdersService.findAllDeliverOrderByWoId(workOrderId);
  }
}
