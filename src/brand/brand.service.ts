import { Injectable } from '@nestjs/common';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { InjectModel } from '@nestjs/mongoose'; //added
import { Model } from 'mongoose'; //added
import { Brand } from './brand.interface'; //added

@Injectable()
export class BrandService {
  // create(createBrandDto: CreateBrandDto) {
  //   return 'This action adds a new brand';
  // }

  constructor(
    @InjectModel('Brand') private readonly brandModel: Model<Brand>,
  ) {}
  async create(createBrandDto: CreateBrandDto): Promise<Brand> {
    const newCat = new this.brandModel(createBrandDto);
    return await newCat.save();
  }

  async findAll(): Promise<Brand[]> {
    const response = await this.brandModel.find().sort({ name: 1 });
    return response;
  }
  async findOne(id: string): Promise<Brand> {
    console.log('IN FIND ONE');
    console.log('id');
    return await this.brandModel.findOne({ _id: id });
  }

  async update(id: string, updateBrandDto: UpdateBrandDto): Promise<Brand> {
    const response = await this.brandModel.findByIdAndUpdate(
      id,
      updateBrandDto,
      { new: true },
    );
    return response;
  }

  async remove(id: string) {
    const result = await this.brandModel.findByIdAndRemove(id);
    return result;
  }
}
