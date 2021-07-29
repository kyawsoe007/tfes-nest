import { Injectable } from '@nestjs/common';
import { CreateDownPaymentDto } from './dto/create-down-payment.dto';
import { UpdateDownPaymentDto } from './dto/update-down-payment.dto';
import { DownPayment } from './down-payment.interface';
import { InjectModel } from '@nestjs/mongoose'; //added
import { Model } from 'mongoose'; //added

@Injectable()
export class DownPaymentService {
  // create(createDownPaymentDto: CreateDownPaymentDto) {
  //   return 'This action adds a new downPayment';
  // }
  constructor(
    @InjectModel('DownPayment')
    private readonly downpaymentModel: Model<DownPayment>,
  ) {}
  async create(
    createDownPaymentDto: CreateDownPaymentDto,
  ): Promise<DownPayment> {
    const newCat = new this.downpaymentModel(createDownPaymentDto);
    return await newCat.save();
  }

  async findAll(): Promise<DownPayment[]> {
    const response = await this.downpaymentModel.find().sort({ amount: 1 });
    return response;
  }
  async findOne(id: string): Promise<DownPayment> {
    return await this.downpaymentModel.findOne({ _id: id });
  }
  async update(
    id: string,
    updateDownPaymentDto: UpdateDownPaymentDto,
  ): Promise<DownPayment> {
    const existingCustomer = await this.downpaymentModel.findByIdAndUpdate(
      { _id: id },
      updateDownPaymentDto,
    );
    return this.findOne(id);
  }

  async remove(id: string): Promise<any> {
    const response = await this.downpaymentModel.findByIdAndRemove({ _id: id });
    return response;
  }
}
