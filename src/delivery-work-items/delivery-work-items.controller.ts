import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DeliveryWoItem } from './delivery-work-items.interface';
import { DeliveryWorkItemsService } from './delivery-work-items.service';
import { CreateDeliveryWorkItemDto } from './dto/create-delivery-work-items.dto';
import { UpdateDeliveryWorkItemDto } from './dto/update-delivery-work-items.dto';

@ApiTags('delivery-work-items')
@Controller('delivery-work-items')
export class DeliveryWorkItemsController {
  constructor(
    private readonly deliveryWorkItemsService: DeliveryWorkItemsService,
  ) {}

  @Post()
  create(@Body() createDeliveryWorkItemDto: CreateDeliveryWorkItemDto) {
    return this.deliveryWorkItemsService.createDeliveryWoItems(
      createDeliveryWorkItemDto,
    );
  }

  @Get('findAllByWoId/:woId')
  async findAllByWoId(@Param('woId') woId: string): Promise<DeliveryWoItem[]> {
    return await this.deliveryWorkItemsService.findAllByWoId(woId);
  }

  @Get('findAllByWoItemId/:woItemId')
  async findAllByWoItemId(
    @Param('woItemId') woItemId: string,
  ): Promise<DeliveryWoItem[]> {
    return await this.deliveryWorkItemsService.findAllByWoItemId(woItemId);
  }

  @Get('findAllByDoId/:doId')
  async findAllByDoId(@Param('doId') doId: string): Promise<DeliveryWoItem[]> {
    return await this.deliveryWorkItemsService.findAllByDoId(doId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDeliveryWorkItemDto: UpdateDeliveryWorkItemDto,
  ): Promise<DeliveryWoItem> {
    return await this.deliveryWorkItemsService.update(
      id,
      updateDeliveryWorkItemDto,
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<any> {
    return await this.deliveryWorkItemsService.remove(id);
  }
}
