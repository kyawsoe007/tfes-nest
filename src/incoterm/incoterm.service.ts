import { Injectable } from '@nestjs/common';
import { CreateIncotermDto } from './dto/create-incoterm.dto';
import { UpdateIncotermDto } from './dto/update-incoterm.dto';
import { InjectModel } from '@nestjs/mongoose'; //added
import { Model } from 'mongoose'; //added
import { Incoterm } from './incoterm.interface'; //added

@Injectable()
export class IncotermService {
  constructor(
    @InjectModel('Incoterm') private readonly incotermModel: Model<Incoterm>,
  ) {}
  async create(createIncotermDto: CreateIncotermDto): Promise<Incoterm> {
    const newCat = new this.incotermModel(createIncotermDto);
    return await newCat.save();
  }
  // create(createIncotermDto: CreateIncotermDto) {
  //   return 'This action adds a new incoterm';
  // }

  async findAll(): Promise<Incoterm[]> {
    const response = await this.incotermModel.find().sort({ name: 1 });
    return response;
  }
  async findOne(id: string): Promise<Incoterm> {
    return await this.incotermModel.findOne({ _id: id });
  }

  async update(
    id: string,
    updateIncotermDto: UpdateIncotermDto,
  ): Promise<Incoterm> {
    const res = await this.incotermModel.findByIdAndUpdate(
      { _id: id },
      updateIncotermDto,
    );
    return this.findOne(id);
  }

  async remove(id: string) {
    const res = await this.incotermModel.findOneAndRemove({ _id: id });
    return res;
  }
}
