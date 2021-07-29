import { Injectable } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm'; // Added this line
// import { Repository } from 'typeorm'; // Added this line
// import { PaymentTermEntity } from './entities/payment-term.entity';
import { InjectModel } from '@nestjs/mongoose'; // Added new Line
import { CreatePaymentTermDto } from './dto/create-payment-term.dto';
import { UpdatePaymentTermDto } from './dto/update-payment-term.dto';
import { PaymentTerm } from './interfaces/payment-terms.interface';
import { Model } from 'mongoose'; // Added new line

@Injectable()
export class PaymentTermsService {
  // Added new Constructor
  constructor(
    @InjectModel('PaymentTerm')
    private readonly paymentTermModel: Model<PaymentTerm>,
  ) {}

  async createNew(
    createPaymentTermDto: CreatePaymentTermDto,
  ): Promise<PaymentTerm> {
    // const response = await new this.paymentTermModel.create(createPaymentTermDto);
    // return response;

    const newPaymentTerm = new this.paymentTermModel(createPaymentTermDto);
    return await newPaymentTerm.save();
  }

  async findAll(): Promise<PaymentTerm[]> {
    const response = await this.paymentTermModel.find();
    return response;
  }

  async findOne(id: string): Promise<PaymentTerm> {
    const response = await this.paymentTermModel.findOne({ _id: id });
    return response;
  }

  async updateOne(
    id: string,
    updatePaymentTermDto: UpdatePaymentTermDto,
  ): Promise<PaymentTerm> {
    // const initial = await this.paymentTermModel.findOne(id);

    // const response = await this.paymentTermModel.save({
    //   ...initial,
    //   ...updatePaymentTermDto,
    // });
    // return response;
    const existingCustomer = await this.paymentTermModel.findByIdAndUpdate(
      { _id: id },
      updatePaymentTermDto,
    );

    return this.findOne(id);
  }

  async removeOne(id: string): Promise<any> {
    const response = await this.paymentTermModel.findByIdAndRemove({ _id: id });
    return response;
  }
}
