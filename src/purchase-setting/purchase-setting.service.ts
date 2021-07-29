import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePurchaseSettingDto } from './dto/create-purchase-setting.dto';
import { UpdatePurchaseSettingDto } from './dto/update-purchase-setting.dto';
import { PurchaseSetting } from './purchase-setting.interface';

@Injectable()
export class PurchaseSettingService {
   // Added new Constructor
   constructor(
    @InjectModel('PurchaseSetting')
    private readonly purchaseSettingModel: Model<PurchaseSetting>
  ) {}

  async create(createPurchaseSettingDto: CreatePurchaseSettingDto):Promise<PurchaseSetting> {
    return await new this.purchaseSettingModel(createPurchaseSettingDto).save();

  }

  async findAll():Promise<PurchaseSetting[]> {
   return await this.purchaseSettingModel
   .find()
   .populate(['account'])
   .exec(); 
  }

  async findOne(id: string):Promise<PurchaseSetting> {
    let response= await this.purchaseSettingModel.findOne({_id:id})
    return response
  }

  async update(id: string, updatePurchaseSettingDto: UpdatePurchaseSettingDto):Promise<PurchaseSetting> {
    return await this.purchaseSettingModel.findByIdAndUpdate(
      {_id:id},
      updatePurchaseSettingDto
    );
  }

  async remove(id: string):Promise<any> {
    return await this.purchaseSettingModel.findByIdAndRemove({_id:id});
   }
}
