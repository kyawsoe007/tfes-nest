import { Injectable } from '@nestjs/common';
import { CreateGrpOneDto } from './dto/create-grp-one.dto';
import { UpdateGrpOneDto } from './dto/update-grp-one.dto';
import { Model } from 'mongoose'; //added
import { GrpOne } from './grp-one.interface'; //added
import { InjectModel } from '@nestjs/mongoose'; //added

@Injectable()
export class GrpOneService {
  constructor(
    @InjectModel('GrpOne') private readonly grponeModel: Model<GrpOne>,
  ) {}

  async create(createGrpOneDto: CreateGrpOneDto): Promise<GrpOne> {
    const newCat = new this.grponeModel(createGrpOneDto);
    return await newCat.save();
  }

  async findAll(): Promise<GrpOne[]> {
    const response = await this.grponeModel.find().sort({ name: 1 });
    return response;
  }
  async findOne(id: string): Promise<GrpOne> {
    return await this.grponeModel.findOne({ _id: id });
  }

  async update(id: string, updateGrpOneDto: UpdateGrpOneDto): Promise<GrpOne> {
    const response = await this.grponeModel.findByIdAndUpdate(
      id,
      updateGrpOneDto,
      { new: true },
    );
    return response;
  }

  async remove(id: string) {
    const result = await this.grponeModel.findByIdAndRemove(id);
    return result;
  }
}
