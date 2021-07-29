import { Injectable } from '@nestjs/common';
import { CreateGrpTwoDto } from './dto/create-grp-two.dto';
import { UpdateGrpTwoDto } from './dto/update-grp-two.dto';
import { Model } from 'mongoose'; //added
import { InjectModel } from '@nestjs/mongoose'; //added
import { GrpTwo } from './grp-two.interface'; //added
@Injectable()
export class GrpTwoService {
  constructor(
    @InjectModel('GrpTwo') private readonly grptwoModel: Model<GrpTwo>,
  ) {}

  // create(createGrpTwoDto: CreateGrpTwoDto) {
  //   return 'This action adds a new grpTwo';
  // }
  async create(createGrpTwoDto: CreateGrpTwoDto): Promise<GrpTwo> {
    const newCat = new this.grptwoModel(createGrpTwoDto);
    return await newCat.save();
  }

  async findAll(): Promise<GrpTwo[]> {
    const response = await this.grptwoModel.find().sort({ name: 1 });
    return response;
  }
  async findOne(id: string): Promise<GrpTwo> {
    return await this.grptwoModel.findOne({ _id: id });
  }

  async update(id: string, updateGrpTwoDto: UpdateGrpTwoDto): Promise<GrpTwo> {
    const response = await this.grptwoModel.findByIdAndUpdate(
      id,
      updateGrpTwoDto,
      { new: true },
    );
    return response;
  }

  async remove(id: string) {
    const result = await this.grptwoModel.findByIdAndRemove(id);
    return result;
  }
}
