import { Model } from 'mongoose'; // Added new line
import { InjectModel } from '@nestjs/mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSequenceSettingDto } from './dto/create-sequence-setting.dto';
import { UpdateSequenceSettingDto } from './dto/update-sequence-setting.dto';
import { SequenceSetting } from './sequence-settings.interface';

@Injectable()
export class SequenceSettingsService {
  soNumber: string | number;

  // Added new Constructor
  constructor(
    @InjectModel('SequenceSetting')
    private readonly sequenceSettingModel: Model<SequenceSetting>,
  ) {}

  // Create New Sequence
  async createNewSequence(
    createSequenceSettingDto: CreateSequenceSettingDto,
  ): Promise<SequenceSetting> {
    const newSequence = new this.sequenceSettingModel(createSequenceSettingDto);
    return newSequence.save();
  }

  // Find All Sequences
  async findAll(): Promise<SequenceSetting[]> {
    const response = await this.sequenceSettingModel.find().exec();
    return response;
  }

  // Find Seqence By Id
  async findOneSequenceById(id: string): Promise<SequenceSetting> {
    return await this.sequenceSettingModel.findOne({ _id: id }).exec();
  }

  // Find Sequence By Modal Name
  async FindSequenceByModelName(
    modalNameArg: string,
  ): Promise<SequenceSetting> {
    const modelNameFound = await this.sequenceSettingModel
      .findOne({
        modelName: modalNameArg,
      })
      .exec();

    if (!modelNameFound) {
      throw new NotFoundException(
        `Modelname ${modalNameArg} does not exist, kindly create one!`,
      );
    }
    return modelNameFound;
  }

  async updateSequenceByModelName(
    modalNameArg: string,
    settings: SequenceSetting,
  ): Promise<SequenceSetting> {
    const newNextNumber = settings.nextNumber + 1;

    const updatedSetting = await this.sequenceSettingModel.findOneAndUpdate(
      { modelName: modalNameArg },
      { nextNumber: newNextNumber },
      { new: true },
    );
    return updatedSetting;
  }

  async updateSequenceById(
    id: string,
    updateSequenceSettingDto: UpdateSequenceSettingDto,
  ): Promise<SequenceSetting> {
    const result = await this.sequenceSettingModel.findByIdAndUpdate(
      { _id: id },
      updateSequenceSettingDto,
      { new: true },
    );
    return result;
  }

  async removeSequenceById(id: string): Promise<any> {
    const response = await this.sequenceSettingModel.findByIdAndRemove({
      _id: id,
    });
    return response;
  }

  sequenceSettingEx(setting: SequenceSetting) {
    let sequenceString = '';
    let fullYear = 0;

    if (setting.prefix) {
      sequenceString += setting.prefix.toUpperCase();
    }

    if (setting.year) {
      fullYear = new Date().getFullYear();
      const yy = fullYear.toString().substr(-2);
      sequenceString += `${yy}-`;
    }

    let nextNumber: string;
    if (setting.nextNumber) {
      nextNumber = setting.nextNumber.toString();
      while (nextNumber.length < setting.numDigits) {
        nextNumber = '0' + nextNumber;
      }
      sequenceString += nextNumber;
    }

    if (setting.suffix) {
      sequenceString += setting.suffix.toUpperCase();
    }

    return sequenceString;
  }

  reformatSettingEx(settings: SequenceSetting, sequencedValue: string) {
    const { prefix } = settings;
    const length: number = prefix.length;
    const newSequence = sequencedValue.substr(length);
    return `${prefix}${newSequence}`;
  }
}
