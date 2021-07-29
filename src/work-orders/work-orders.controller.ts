import {
  Controller,
  Get,
  Body,
  Param,
  Delete,
  Post,
  Patch,
  Header,
  Res,
} from '@nestjs/common';
import { WorkOrdersService } from './work-orders.service';
import { ApiTags } from '@nestjs/swagger';
import { WorkOrder, WorkOrderItems } from './interfaces/work-orders.interface';
import { FilterDto } from 'src/shared/filter.dto';
import { Response } from 'express';

import fs = require('fs-extra');
import path = require('path');
import ejs = require('ejs');
import pdf = require('html-pdf');
import { printPdfOptions } from '../shared/printPdfOptions';
import { ValidateObjectId } from '../shared/validate-object-id.pipes';
import { ConfirmWoItemDto } from './dto/confirm-work-item.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { OnResetWoItemDto } from './dto/reset-work-item.dto';

@ApiTags('work-orders')
@Controller('work-orders')
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Post('getfilters')
  async getfilters(@Body() query: FilterDto) {
    const result = await this.workOrdersService.getfilters(query);
    return result;
  }

  @Get()
  findAllWorkOrders() {
    return this.workOrdersService.findAllWorkOrders();
  }

  @Get(':id')
  async findOneWorkOrder(
    @Param('id', new ValidateObjectId()) id: string,
  ): Promise<WorkOrder> {
    return await this.workOrdersService.findOneWorkOrder(id);
  }

  @Delete(':id')
  removeWorkOrder(@Param('id') id: string) {
    return this.workOrdersService.removeWorkOrder(id);
  }

  @Patch(':id')
  updateWorkOrder(
    @Param('id', new ValidateObjectId()) id: string,
    @Body() updateWorkOrderDto,
  ) {
    return this.workOrdersService.updateWorkOrder(id, updateWorkOrderDto);
  }

  @Get('find-completed-wo-by-soId/:salesOrderId')
  async findCompletedWorkOrderItemBySalesOrderId(
    @Param('salesOrderId') salesOrderId: string,
  ): Promise<WorkOrderItems[]> {
    return await this.workOrdersService.findCompletedWorkOrderItemBySalesOrderId(
      salesOrderId,
    );
  }

  @Get('updateDoStatusAndSoStatus/:salesOrderId')
  async updateDoStatusAndSoStatus(
    @Param('salesOrderId') salesOrderId: string,
  ): Promise<any> {
    return await this.workOrdersService.updateDoStatusAndSoStatus(salesOrderId);
  }

  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename=workOrder.pdf')
  @Get('/pdf/:id')
  async generatePdF(
    @Param('id', new ValidateObjectId()) id: string,
    @Res() response: Response,
  ): Promise<void> {
    const workOrder = await this.workOrdersService.generatePdf(id);

    const layoutHtml = fs.readFileSync(
      path.resolve('./src/work-orders/templates', 'workOrder.ejs'),
      'utf8',
    );
    const render = ejs.render(layoutHtml, {
      data: workOrder,
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

  @Get('/getWorkOrderByOrderId/:salesOrderId')
  getWorkOrderByOrderId(
    @Param('salesOrderId', new ValidateObjectId()) salesOrderId: string,
  ): Promise<WorkOrder> {
    return this.workOrdersService.getWorkOrderByOrderId(salesOrderId);
  }

  @Patch('confirmWoSkuQty/:woItemId')
  confirmWoItemQty(
    @Param('woItemId', new ValidateObjectId()) woItemId: string,
    @Body() confirmWoItemDto: ConfirmWoItemDto,
  ): Promise<WorkOrder> {
    return this.workOrdersService.confirmWoItemQty(woItemId, confirmWoItemDto);
  }

  @Patch('/updateSimpleByAdmin/:workOrderId')
  updateSimpleByAdmin(
    @Param('workOrderId', new ValidateObjectId()) workOrderId: string,
    @Body() updateWorkOrderDto: UpdateWorkOrderDto,
  ): Promise<WorkOrder> {
    return this.workOrdersService.updateSimpleByAdmin(
      workOrderId,
      updateWorkOrderDto,
    );
  }

  @Patch('/lightResetWorkOrder/:workOrderId')
  lightResetWorkOrder(
    @Param('workOrderId', new ValidateObjectId()) workOrderId: string,
  ) {
    return this.workOrdersService.lightResetWorkOrder(workOrderId);
  }

  @Patch('/mediumResetWorkItems/:workOrderId')
  mediumResetWorkItems(
    @Param('workOrderId', new ValidateObjectId()) workOrderId: string,
    @Body() resetWorkItemsDto: OnResetWoItemDto,
  ) {
    return this.workOrdersService.mediumResetWorkItems(
      workOrderId,
      resetWorkItemsDto,
    );
  }
}
