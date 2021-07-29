import { PaymentMethod } from './payment-method.interface';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { Model } from 'mongoose';
@Injectable()
export class PaymentMethodService {
  constructor(
    @InjectModel('PaymentMethod')
    private readonly paymentMethodModel: Model<PaymentMethod>
  ) {}

  async create(createPaymentMethodDto: CreatePaymentMethodDto): Promise<PaymentMethod> {
    const newData = new this.paymentMethodModel(createPaymentMethodDto);
    return await newData.save();
  }

  async findAll(): Promise<PaymentMethod[]> {
    const response = await this.paymentMethodModel
      .find()
      .sort({name: 1})
      .populate('account')
      .populate('journal')
      .populate('currency')
      .exec();

    return  response;
  }

  async findOne(id: string): Promise<PaymentMethod> {
    const paymentMethod= await this.paymentMethodModel
        .findOne({_id:id})
        .populate('account')
        .populate('journal')
        .populate('currency')
        .exec();

    if (!paymentMethod) {
      throw new NotFoundException(`This Payment Method doesn't exit`);
    }

    return paymentMethod;
  }

  async update(id: string, updatePaymentMethodDto: UpdatePaymentMethodDto): Promise<PaymentMethod> {
    const accountJournal = await this.paymentMethodModel.findOne({ _id: id });
    if (!accountJournal) {
      throw new NotFoundException('Payment Method item not Found');
    }
    const response = await this.paymentMethodModel.findByIdAndUpdate(
      id,
        updatePaymentMethodDto,
      { new: true }
    );
    return response;
  }

  async remove(id: string) {
    const deletedPaymentMethod = await this.paymentMethodModel.findByIdAndRemove({
      _id:id,
    });
    return deletedPaymentMethod;
  }
}

