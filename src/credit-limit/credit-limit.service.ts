import { CreditLimit } from 'src/credit-limit/credit-limit.interface';
import { Injectable } from '@nestjs/common';
import { CreateCreditLimitDto } from './dto/create-credit-limit.dto';
import { UpdateCreditLimitDto } from './dto/update-credit-limit.dto';
import { InjectModel } from '@nestjs/mongoose'; //added
import { Model } from 'mongoose'; //added

@Injectable()
export class CreditLimitService {
  // create(createCreditLimitDto: CreateCreditLimitDto) {
  //   return 'This action adds a new creditLimit';
  // }

  constructor(
    @InjectModel('CreditLimit')
    private readonly creditlimitModel: Model<CreditLimit>,
  ) {}
  async create(
    createCreditLimitDto: CreateCreditLimitDto,
  ): Promise<CreditLimit> {
    const newCat = new this.creditlimitModel(createCreditLimitDto);
    return await newCat.save();
  }

  async findAll(): Promise<CreditLimit[]> {
    const response = await this.creditlimitModel.find();
    return response;
  }
  async findOne(id: string): Promise<CreditLimit> {
    return await this.creditlimitModel.findOne({ _id: id });
  }
  async update(id: string, updateCreditLimitDto: UpdateCreditLimitDto):Promise<CreditLimit> {
    const res=await this.creditlimitModel.findByIdAndUpdate({_id:id},updateCreditLimitDto) 
    return this.findOne(id);
  }

  async remove(id: string):Promise<any> {
    const res = await this.creditlimitModel.findOneAndRemove({ _id: id });
    return res;
  }
}
