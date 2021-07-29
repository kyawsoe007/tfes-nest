import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { QueryPayload } from '../work-orders/interfaces/work-orders.interface';
import { CreateWorkOrderPickingDto } from './dto/create-work-order-picking.dto';
import { UpdateOneWoPickingDto } from './dto/update-one-pickingOrder.dto';
import { WorkOrderPicking } from './work-order-pickings.interface';

@Injectable()
export class WorkOrderPickingsService {
  // Added new Constructor
  constructor(
    @InjectModel('WorkOrderPicking')
    private readonly workOrderPickingModel: Model<WorkOrderPicking>,
  ) {}

  async updateWorkOrderPickingStatus(
    id: string,
    workItem: any,
    status: string,
    highestAmount: number,
    confirmQty: number,
  ) {
    console.log('updateWorkOrderPickingStatus, partialCount, FLOW 4');
    console.log('what is woItemid', workItem.woItemId);

    const woPickingItem = await this.workOrderPickingModel.findById(id);

    if (woPickingItem) {
      if (workItem && workItem.bom) {
        woPickingItem.woPickingStatus = status;
        woPickingItem.checkConfirmWoItem = true;
        woPickingItem.partialCount = highestAmount;
        woPickingItem.bomQtyInput = confirmQty;

        return await woPickingItem.save();
      } else {
        woPickingItem.woPickingStatus = status;
        woPickingItem.checkConfirmWoItem = true;
        woPickingItem.partialCount = highestAmount;

        return await woPickingItem.save();
      }
    }
  }

  async createWorkOrderPickingList(
    createWorkOrderPickingDto: CreateWorkOrderPickingDto,
  ) {
    console.log('createWorkOrderPickingDto', createWorkOrderPickingDto);
    const newData = new this.workOrderPickingModel(createWorkOrderPickingDto);
    return await newData.save();
  }

  async findOneWorkOrderPickingByWoPickingId(
    woPickingId: string,
  ): Promise<WorkOrderPicking> {
    return await this.workOrderPickingModel.findById(woPickingId);
  }

  // Be Caution, this involve deleteMany and InsertMany
  async updateWorkOrderPickingByDeleteAndInsertMany(
    workOrderId: string,
    pickingListArray,
  ) {
    await this.workOrderPickingModel.deleteMany({
      workOrderId: workOrderId,
    });

    const response = await this.workOrderPickingModel.insertMany(
      pickingListArray,
    );

    return response;
  }

  async deleteMany(workOrderId: string): Promise<any> {
    const response = await this.workOrderPickingModel.deleteMany({
      workOrderId,
    });

    console.log('WorkPicking Removed if any', response);
    return response;
  }

  async deleteManyByWoItemId(woItemId: string): Promise<any> {
    return await this.workOrderPickingModel.deleteMany({
      woItemId,
    });
  }

  async findAllWorkOrderPickings(): Promise<WorkOrderPicking[]> {
    const response = await this.workOrderPickingModel.find();

    return response;
  }

  async findAllWorkOrderPickingsItemByWoItemId(
    woItemId: string,
  ): Promise<WorkOrderPicking[]> {
    return await this.workOrderPickingModel.find({
      woItemId: woItemId,
    });
  }

  async removeWorkOrderPicking(id: string) {
    await this.workOrderPickingModel.findByIdAndRemove(id);
  }

  async findAllWorkOrderPickingByWoId(
    workOrderId: string,
  ): Promise<WorkOrderPicking[]> {
    const response = await this.workOrderPickingModel.find({
      workOrderId: workOrderId,
    });

    return response;
  }

  async findAllWorkOrderPickingByWoItemId(
    woItemId: string,
  ): Promise<WorkOrderPicking[]> {
    const response = await this.workOrderPickingModel.find({
      woItemId: woItemId,
    });

    return response;
  }

  async findAllWorkOrderPickingByWoItemIdAndPartialCountExisted(
    woItemId: string,
  ): Promise<WorkOrderPicking[]> {
    const response = await this.workOrderPickingModel.find({
      woItemId: woItemId,
      partialCount: { $exists: true },
    });

    return response;
  }

  async updateOneWoPickingById(
    id: string,
    updateOneWoPickingDto: UpdateOneWoPickingDto,
  ) {
    const response = await this.workOrderPickingModel.findByIdAndUpdate(
      id,
      updateOneWoPickingDto,
      {
        new: true,
      },
    );
    return response;
  }

  async findOneWorkOrderPickingById(id: string): Promise<WorkOrderPicking> {
    return await this.workOrderPickingModel.findById(id);
  }

  async findAllWorkOrderPickingByWoIdAndWoPickingStatus(
    woId: string,
    woPickingStatus: string,
  ): Promise<WorkOrderPicking[]> {
    return await this.workOrderPickingModel.find({
      workOrderId: woId,
      woPickingStatus: woPickingStatus,
    });
  }

  async findAllWorkOrderPickingByWorkItemIdAndPickedSku(
    woItemId: string,
    pickedSkuId: string,
  ): Promise<WorkOrderPicking[]> {
    return await this.workOrderPickingModel.find({
      woItemId: woItemId,
      pickedSkuId: pickedSkuId,
    });
  }

  async findAllWorkOrderPickingByWoIdAndWorkItemId(
    woId: string,
    woItemId: string,
  ): Promise<WorkOrderPicking[]> {
    return await this.workOrderPickingModel.find({
      workOrderId: woId,
      woItemId: woItemId,
    });
  }

  async deleteManyNonCompletedItemByWoIdAndWoPickingStatus(
    workOrderId: string,
    woPickingStatus: string,
  ): Promise<any> {
    const response = await this.workOrderPickingModel.deleteMany({
      workOrderId: workOrderId,
      woPickingStatus: { $ne: woPickingStatus },
    });

    console.log('Non Completed WorkPicking Removed if any', response);
    return response;
  }

  async updateOneWoPickingByIdFromReset(
    id: string,
    updateOneWoPickingDto: UpdateOneWoPickingDto,
  ) {
    const response = await this.workOrderPickingModel.findByIdAndUpdate(
      id,
      updateOneWoPickingDto,
      {
        new: true,
        upsert: true,
      },
    );
    return response;
  }

  async deleteManyByWoItemsAndWoPickingStatus(
    woItemId: string,
    woPickingStatus: string,
  ): Promise<any> {
    const response = await this.workOrderPickingModel.deleteMany({
      woItemId: woItemId,
      woPickingStatus: woPickingStatus,
    });

    console.log('WorkPicking Removed if any', response);
    return response;
  }
}
