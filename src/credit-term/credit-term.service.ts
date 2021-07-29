import { Injectable } from '@nestjs/common';
import { CreateCreditTermDto } from './dto/create-credit-term.dto';
import { UpdateCreditTermDto } from './dto/update-credit-term.dto';
import { InjectModel } from '@nestjs/mongoose'; //added
import { Model } from 'mongoose'; //added
import { CreditTerm } from './credit-term.interface';
@Injectable()
export class CreditTermService {
  // create(createCreditTermDto: CreateCreditTermDto) {
  //   return 'This action adds a new creditTerm';
  // }
  constructor(
    @InjectModel('CreditTerm')
    private readonly credittermModel: Model<CreditTerm>,
  ) {}
  async create(createCreditTermDto: CreateCreditTermDto): Promise<CreditTerm> {
    const newCat = new this.credittermModel(createCreditTermDto);
    return await newCat.save();
  }

  async findAll(): Promise<CreditTerm[]> {
    const response = await this.credittermModel.find();
    return response;
  }
  async findOne(id: string): Promise<CreditTerm> {
    return await this.credittermModel.findOne({ _id: id });
  }

  async update(id: string, updateCreditTermDto: UpdateCreditTermDto):Promise<CreditTerm> {
    const response=await this.credittermModel.findByIdAndUpdate({_id:id},updateCreditTermDto)
    return this.findOne(id);
  }

  async remove(id: string):Promise<any> {
    const response = await this.credittermModel.findOneAndRemove({ _id: id });
    return response;
  }
}
