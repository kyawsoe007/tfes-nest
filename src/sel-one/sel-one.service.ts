import { Injectable } from '@nestjs/common';
import { CreateSelOneDto } from './dto/create-sel-one.dto';
import { UpdateSelOneDto } from './dto/update-sel-one.dto';
import { Model } from 'mongoose'; //added
import { SelOne } from './sel-one.interface'; //added
import { InjectModel } from '@nestjs/mongoose'; //added

@Injectable()
export class SelOneService {
  // create(createSelOneDto: CreateSelOneDto) {
  //   return 'This action adds a new selOne';
  // }
  constructor(
    @InjectModel('SelOne') private readonly seloneModel: Model<SelOne>,
  ) {}

  async create(createSelOneDto: CreateSelOneDto): Promise<SelOne> {
    const newCat = new this.seloneModel(createSelOneDto);
    return await newCat.save();
  }

  async findAll(): Promise<SelOne[]> {
    const response = await this.seloneModel.find();
    return response;
  }
  async findOne(id: string): Promise<SelOne> {
    return await this.seloneModel.findOne({ _id: id });
  }

  update(id: string, updateSelOneDto: UpdateSelOneDto) {
    return `This action updates a #${id} selOne`;
  }

  remove(id: string) {
    return `This action removes a #${id} selOne`;
  }
}
