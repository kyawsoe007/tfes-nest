import { Injectable } from '@nestjs/common';
import { CreateSizeDto } from './dto/create-size.dto';
import { UpdateSizeDto } from './dto/update-size.dto';
import { Model } from 'mongoose'; //added
import { Size } from './size.interface'; //added
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class SizeService {
  // create(createSizeDto: CreateSizeDto) {
  //   return 'This action adds a new size';
  // }
  constructor(@InjectModel('Size') private readonly sizeModel: Model<Size>) {}
  async create(createSizeDto: CreateSizeDto): Promise<Size> {
    const newCat = new this.sizeModel(createSizeDto);
    return await newCat.save();
  }
  async findAll(): Promise<Size[]> {
    const response = await this.sizeModel.find();
    return response;
  }
  async findOne(id: string): Promise<Size> {
    return await this.sizeModel.findOne({ _id: id }).populate('brand');
  }

  async update(id: string, updateSizeDto: UpdateSizeDto): Promise<Size> {
    const response = await this.sizeModel.findByIdAndUpdate(id, updateSizeDto, {
      new: true,
    });
    return response;
  }

  async remove(id: string) {
    const result = await this.sizeModel.findByIdAndRemove(id);
    return result;
  }
}
