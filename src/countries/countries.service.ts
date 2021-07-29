import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { Country } from './countries.interface';
import { Model } from 'mongoose';

@Injectable()
export class CountriesService {
  // Added new Constructor
  constructor(
    @InjectModel('Country') private readonly countryModel: Model<Country>,
  ) {}

  async create(createCountryDto: CreateCountryDto): Promise<Country> {
    const newCountry = new this.countryModel(createCountryDto);
    return await newCountry.save();
  }

  async findAll(): Promise<Country[]> {
    const response = await this.countryModel.find().sort({ name: 1 });
    return response;
  }

  async findOne(id: string): Promise<Country> {
    const response = await this.countryModel.findById(id);
    return response;
  }

  async update(
    id: string,
    updateCountryDto: UpdateCountryDto,
  ): Promise<Country> {
    const editedCountry = await this.countryModel.findByIdAndUpdate(
      id,
      updateCountryDto,
      { new: true },
    );
    return editedCountry;
  }

  async remove(id: string): Promise<Country> {
    const deletedCountry = await this.countryModel.findByIdAndRemove(id);
    return deletedCountry;
  }
}
