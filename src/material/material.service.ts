import { Injectable } from '@nestjs/common';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { Model } from 'mongoose'; //added
import { Material } from './material.interface'; //added
import { InjectModel } from '@nestjs/mongoose'; //added
@Injectable()
export class MaterialService {
  // create(createMaterialDto: CreateMaterialDto) {
  //   return 'This action adds a new material';
  // }

  constructor(
    @InjectModel('Material') private readonly materialModel: Model<Material>,
  ) {}

  async create(createMaterialDto: CreateMaterialDto): Promise<Material> {
    const newCat = new this.materialModel(createMaterialDto);
    return await newCat.save();
  }

  async findAll(): Promise<Material[]> {
    const response = await this.materialModel.find().sort({ name: 1 });
    return response;
  }
  async findOne(id: string): Promise<Material> {
    return await this.materialModel.findOne({ _id: id });
  }

  async update(
    id: string,
    updateMaterialDto: UpdateMaterialDto,
  ): Promise<Material> {
    const response = await this.materialModel.findByIdAndUpdate(
      id,
      updateMaterialDto,
      { new: true },
    );
    return response;
  }

  async remove(id: string) {
    const result = await this.materialModel.findByIdAndRemove(id);
    return result;
  }
}
