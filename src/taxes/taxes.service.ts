import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';
import { Tax } from './taxes.interface';
import { Model } from 'mongoose';

@Injectable()
export class TaxesService {
  // Added new Constructor
  constructor(@InjectModel('Tax') private readonly taxModel: Model<Tax>) {}

  async create(createTaxDto: CreateTaxDto): Promise<Tax> {
    const response = new this.taxModel(createTaxDto);
    return await response.save();
  }

  async findAll(): Promise<Tax[]> {
    const response = await this.taxModel
        .find()
        .populate('account')
        .exec();

    return response;
  }

  async findOne(id: string): Promise<Tax> {
    const response = await this.taxModel
        .findById(id)
        .populate('account')
        .exec();

    return response;
  }

  async findByName(name: string): Promise<Tax> {
    const response = await this.taxModel
        .findOne({ name: name })
        .exec();

    return response;
  }

  async update(id: string, updateTaxDto: UpdateTaxDto): Promise<Tax> {
    const response = await this.taxModel.findByIdAndUpdate(id, updateTaxDto, {
      new: true,
    });
    return response;
  }

  async remove(id: string): Promise<Tax> {
    const response = await this.taxModel.findByIdAndRemove(id);
    return response;
  }
}
