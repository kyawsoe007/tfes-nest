import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Currency } from 'src/currencies/currencies.interface';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';

@Injectable()
export class DiscountsService {
  // Added new Constructor
  constructor(
    @InjectModel('Discount') private readonly discountModel: Model<Currency>,
  ) {}
  async create(createDiscountDto: CreateDiscountDto) {
    const discounts = await this.findAll();
    if (discounts && discounts.length > 0) {
      for (const discount of discounts) {
        if (discount.name == createDiscountDto.name) {
          throw new BadRequestException('Discount description already existed');
        }
      }
    }
    const response = new this.discountModel(createDiscountDto);
    return await response.save();
  }

  async findAll() {
    const response = await this.discountModel.find();
    return response;
  }

  async findOne(id: string) {
    const response = await this.discountModel.findById(id);
    return response;
  }

  async findType(type: string) {
    const response = await this.discountModel.find({ type: type });
    return response;
  }

  async update(id: string, updateDiscountDto: UpdateDiscountDto) {
    const discounts = await this.findAll();
    if (discounts && discounts.length > 0) {
      for (const discount of discounts) {
        if (discount.name == updateDiscountDto.name) {
          throw new BadRequestException('Discount description already existed');
        }
      }
    }
    const response = await this.discountModel.findByIdAndUpdate(
      id,
      updateDiscountDto,
      { new: true },
    );
    return response;
  }

  async remove(id: string) {
    const response = await this.discountModel.findByIdAndRemove(id);
    return response;
  }
}
