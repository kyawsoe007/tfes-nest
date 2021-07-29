import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DeliveryWoItem } from './delivery-work-items.interface';
import { CreateDeliveryWorkItemDto } from './dto/create-delivery-work-items.dto';
import { UpdateDeliveryWorkItemDto } from './dto/update-delivery-work-items.dto';

@Injectable()
export class DeliveryWorkItemsService {
  constructor(
    @InjectModel('DeliveryWoItem')
    private readonly deliveryWoItemModel: Model<DeliveryWoItem>,
  ) {}

  async findAllDoWoItemsByWoItemId(
    woItemId: string,
  ): Promise<DeliveryWoItem[]> {
    return await this.deliveryWoItemModel.find({
      woItemId: woItemId,
    });
  }

  async findAllDoWoItemsByWoItemIdAndPartialCount(
    woItemId: string,
    partialCount: number,
  ): Promise<DeliveryWoItem[]> {
    return await this.deliveryWoItemModel.find({
      woItemId: woItemId,
      partialCount: partialCount,
    });
  }

  async findAllDoWoItemsByWoItemIdAndIsClosed(
    woItemId: string,
  ): Promise<DeliveryWoItem[]> {
    return await this.deliveryWoItemModel.find({
      woItemId: woItemId,
      isClosed: true,
    });
  }

  async createDeliveryWoItems(
    createDeliveryWorkItemDto: CreateDeliveryWorkItemDto,
  ) {
    const deliverWoItem = new this.deliveryWoItemModel(
      createDeliveryWorkItemDto,
    );
    return await deliverWoItem.save();
  }

  async updateManyDeliveryWoItemsByDeliveryId(
    deliveryId: string,
    updateDeliveryWorkItemDto: UpdateDeliveryWorkItemDto,
  ): Promise<any> {
    return await this.deliveryWoItemModel.updateMany(
      { deliveryId: deliveryId },
      updateDeliveryWorkItemDto,
    );
  }

  async findAllByWoId(woId: string): Promise<DeliveryWoItem[]> {
    return await this.deliveryWoItemModel.find({
      workOrderId: woId,
    });
  }

  async findAllByWoItemId(woItemId: string): Promise<DeliveryWoItem[]> {
    return await this.deliveryWoItemModel.find({
      woItemId: woItemId,
    });
  }

  async findAllByDoId(doId: string): Promise<DeliveryWoItem[]> {
    return await this.deliveryWoItemModel.find({
      deliveryId: doId,
    });
  }

  async update(
    id: string,
    updateDeliveryWorkItemDto: UpdateDeliveryWorkItemDto,
  ): Promise<DeliveryWoItem> {
    const response = await this.deliveryWoItemModel.findByIdAndUpdate(
      id,
      updateDeliveryWorkItemDto,
      { new: true },
    );
    return response;
  }

  async remove(id: string): Promise<any> {
    const response = await this.deliveryWoItemModel.findByIdAndRemove(id);
    return response;
  }

  async removeAllDoWorkItemsByWoId(woId: string): Promise<any> {
    const response = await this.deliveryWoItemModel.deleteMany({
      workOrderId: woId,
    });

    console.log('DO Items Removed if any', response);
    return response;
  }

  async removeAllDoWorkItemsByDoId(doId: string): Promise<any> {
    const response = await this.deliveryWoItemModel.deleteMany({
      deliveryId: doId,
    });

    console.log('DO Items Removed if any', response);
    return response;
  }
}
