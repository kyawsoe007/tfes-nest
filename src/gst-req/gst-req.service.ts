import { Injectable } from '@nestjs/common';
import { CreateGstReqDto } from './dto/create-gst-req.dto';
import { UpdateGstReqDto } from './dto/update-gst-req.dto';
import { InjectModel } from '@nestjs/mongoose'; //added
import { GstReq } from './gst-req.interface';
import { Model } from 'mongoose'; //added

@Injectable()
export class GstReqService {
  // create(createGstReqDto: CreateGstReqDto) {
  //   return 'This action adds a new gstReq';
  // }
  constructor(
    @InjectModel('GstReq') private readonly gstreqModel: Model<GstReq>,
  ) {}

  async create(createGstReqDto: CreateGstReqDto): Promise<GstReq> {
    const response = new this.gstreqModel(createGstReqDto);
    return await response.save();
  }

  async findAll(): Promise<GstReq[]> {
    const response = await this.gstreqModel.find();
    return response;
  }
  async findOne(id: string): Promise<GstReq> {
    return await this.gstreqModel.findOne({ _id: id });
  }

  update(id: string, updateGstReqDto: UpdateGstReqDto) {
    return `This action updates a #${id} gstReq`;
  }

  remove(id: string) {
    return `This action removes a #${id} gstReq`;
  }
}
