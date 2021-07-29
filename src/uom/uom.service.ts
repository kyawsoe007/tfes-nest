import { Injectable } from '@nestjs/common';
import { CreateUomDto } from './dto/create-uom.dto';
import { UpdateUomDto } from './dto/update-uom.dto';
import { Model } from 'mongoose'; //added
import { Uom } from './uom.interface'; //added
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class UomService {
  // create(createUomDto: CreateUomDto) {
  //   return 'This action adds a new uom';
  // }
  constructor(@InjectModel('Uom') private readonly uomModel: Model<Uom>) {}
  async create(createUomDto: CreateUomDto): Promise<Uom> {
    const newCat = new this.uomModel(createUomDto);
    return await newCat.save();
  }
  async findAll(): Promise<Uom[]> {
    const response = await this.uomModel.find().sort({ name: 1 });
    return response;
  }
  async findOne(id: string): Promise<Uom> {
    return await this.uomModel.findOne({ _id: id }).populate('brand');
  }

  async update(id: string, updateUomDto: UpdateUomDto): Promise<Uom> {
    const response = await this.uomModel.findByIdAndUpdate(id, updateUomDto, {
      new: true,
    });
    return response;
  }

  async remove(id: string) {
    const result = await this.uomModel.findByIdAndRemove(id);
    return result;
  }
}
