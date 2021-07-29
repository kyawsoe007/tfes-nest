import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
// import { CreatePurchaseBySelectionDto } from '../purchase-order/dto/create-by-selection-purchase-order.dto';
import { CreatePurchaseListTempDto } from './dto/create-purchase-list-temp.dto';
import { UpdatePurchaseListTempDto } from './dto/update-purchase-list-temp.dto';
import { PurchaseListTemp } from './purchase-list-temp.interface';

@Injectable()
export class PurchaseListTempService {
  constructor(
    @InjectModel('PurchaseListTemp')
    private readonly purchaseListTempModel: Model<PurchaseListTemp>,
  ) {}

  async create(
    createPurchaseListTempDto: CreatePurchaseListTempDto,
  ): Promise<PurchaseListTemp> {
    const response = new this.purchaseListTempModel(createPurchaseListTempDto);
    return await response.save();
  }

  async findAll(): Promise<PurchaseListTemp[]> {
    const response = await this.purchaseListTempModel.find();
    return response;
  }

  async findOne(id: string): Promise<PurchaseListTemp> {
    return await this.purchaseListTempModel.findOne({ _id: id });
  }

  async update(
    id: string,
    updatePurchaseListTempDto: UpdatePurchaseListTempDto,
  ): Promise<PurchaseListTemp> {
    const response = await this.purchaseListTempModel.findByIdAndUpdate(
      id,
      updatePurchaseListTempDto,
      { new: true },
    );

    return response;
  }

  async remove(id: string): Promise<any> {
    const result = await this.purchaseListTempModel.findByIdAndRemove(id);
    return result;
  }

  async removeProductAndIsPoSubmittedFalse(
    productId: string,
    soId: string,
  ): Promise<any> {
    await this.purchaseListTempModel.deleteMany({
      salesOrderId: soId,
      productId: productId,
      isPoSubmitted: false,
    });
  }

  async findAllPOListTempBySalesOrderIdNonChecked(
    salesOrderId: string,
  ): Promise<PurchaseListTemp[]> {
    return await this.purchaseListTempModel.find({
      salesOrderId: salesOrderId,
      isChecked: false,
    });
  }

  async findAllPOListTempBySalesOrderId(
    salesOrderId: string,
  ): Promise<PurchaseListTemp[]> {
    return await this.purchaseListTempModel.find({
      salesOrderId: salesOrderId,
    });
  }

  async findAllPOListTempBySalesOrderIdNonPOSubmitted(
    salesOrderId: string,
  ): Promise<PurchaseListTemp[]> {
    return await this.purchaseListTempModel.find({
      salesOrderId: salesOrderId,
      isPoSubmitted: false,
    });
  }
}
