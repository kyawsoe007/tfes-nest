import { InjectModel } from '@nestjs/mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';

import { UpdateBomDto } from './dto/update-bom.dto';
import { Model } from 'mongoose';
import { Bom } from './boms.interface';

@Injectable()
export class BomsService {
  // Added new Constructor
  constructor(@InjectModel('Bom') private readonly bomModel: Model<Bom>) {}

  async createBOMfromDesc(bomResult) {
    const response = new this.bomModel(bomResult);
    return await response.save();
  }

  async create(bomResult) {
    await this.remove(bomResult._id);
    const bom = await this.bomModel.findById(bomResult._id);

    if (!bom) {
      const response = new this.bomModel(bomResult);
      return await response.save();
    }
  }

  async findAll(): Promise<Bom[]> {
    const response = await this.bomModel.find();
    return response;
  }

  async findOne(id: string): Promise<Bom> {
    const response = await this.bomModel.findById(id);
    if (!response) {
      throw new NotFoundException('Bom data does not exist!');
    }
    return response;
  }

  async update(id: string, updateBomDto: UpdateBomDto): Promise<Bom> {
    const response = await this.bomModel.findByIdAndUpdate(id, updateBomDto, {
      new: true,
    });
    return response;
  }

  async remove(id: string): Promise<any> {
    return await this.bomModel.findByIdAndRemove(id);
  }

  // async removeIsCreatedFalse(id: string): Promise<any> {
  //   const bom = await this.bomModel.findById(id);

  //   if (bom.isCreated === false) {
  //     return await this.remove(bom._id);
  //   }
  //   return true;
  // }
}
