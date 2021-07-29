import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';

import { CreatePurchaseListTempDto } from './dto/create-purchase-list-temp.dto';
import { UpdatePurchaseListTempDto } from './dto/update-purchase-list-temp.dto';
import { ApiTags } from '@nestjs/swagger';
import { PurchaseListTemp } from './purchase-list-temp.interface';
import { PurchaseListTempService } from './purchase-list-temp.service';
import { ValidateObjectId } from '../shared/validate-object-id.pipes';

@ApiTags('Purchase-List-Temp')
@Controller('Purchase-List-Temp')
export class PurchaseListTempController {
  constructor(
    private readonly purchaseListTempService: PurchaseListTempService,
  ) {}

  @Post()
  async create(
    @Body() createPurchaseListTempDto: CreatePurchaseListTempDto,
  ): Promise<PurchaseListTemp> {
    return this.purchaseListTempService.create(createPurchaseListTempDto);
  }

  @Get()
  async findAll(): Promise<PurchaseListTemp[]> {
    return this.purchaseListTempService.findAll();
  }

  @Get(':id')
  async findOne(
    @Param('id', new ValidateObjectId()) id: string,
  ): Promise<PurchaseListTemp> {
    return this.purchaseListTempService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', new ValidateObjectId()) id: string,
    @Body() updatePurchaseListTempDto: UpdatePurchaseListTempDto,
  ): Promise<PurchaseListTemp> {
    return this.purchaseListTempService.update(id, updatePurchaseListTempDto);
  }

  @Delete(':id')
  async remove(@Param('id', new ValidateObjectId()) id: string): Promise<void> {
    return this.purchaseListTempService.remove(id);
  }

  @Get('/findAllPOListTempBySalesOrderIdNonChecked/:salesOrderId')
  async findAllPOListTempBySalesOrderIdNonChecked(
    @Param('salesOrderId') salesOrderId: string,
  ): Promise<PurchaseListTemp[]> {
    return this.purchaseListTempService.findAllPOListTempBySalesOrderIdNonChecked(
      salesOrderId,
    );
  }

  @Get('/findAllPOListTempBySalesOrderId/:salesOrderId')
  async findAllPOListTempBySalesOrderId(
    @Param('salesOrderId', new ValidateObjectId()) salesOrderId: string,
  ): Promise<PurchaseListTemp[]> {
    return this.purchaseListTempService.findAllPOListTempBySalesOrderId(
      salesOrderId,
    );
  }
}
