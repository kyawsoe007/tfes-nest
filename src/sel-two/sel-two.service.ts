import { Injectable } from '@nestjs/common';
import { CreateSelTwoDto } from './dto/create-sel-two.dto';
import { UpdateSelTwoDto } from './dto/update-sel-two.dto';
import { Model } from 'mongoose'; //added
import { SelTwo } from './sel-two.interface'; //added
import { InjectModel } from '@nestjs/mongoose'; //added

@Injectable()
export class SelTwoService {
  // create(createSelTwoDto: CreateSelTwoDto) {
  //   return 'This action adds a new selTwo';
  // }
  constructor(
    @InjectModel('SelTwo') private readonly seltwoModel: Model<SelTwo>,
  ) {}

  async create(createSelTwoDto: CreateSelTwoDto): Promise<SelTwo> {
    const newCat = new this.seltwoModel(createSelTwoDto);
    return await newCat.save();
  }

  async findAll(): Promise<SelTwo[]> {
    const response = await this.seltwoModel.find();
    return response;
  }
  async findOne(id: string): Promise<SelTwo> {
    return await this.seltwoModel.findOne({ _id: id });
  }

  update(id: string, updateSelTwoDto: UpdateSelTwoDto) {
    return `This action updates a #${id} selTwo`;
  }

  remove(id: string) {
    return `This action removes a #${id} selTwo`;
  }
}
