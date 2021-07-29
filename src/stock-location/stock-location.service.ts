import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateStockLocationDto } from './dto/create-stock-location.dto';
import { StockLocation } from './stock-location.interface';
import { UpdateStockLocationDto } from './dto/update-stock.location.dto';

@Injectable()
export class StockLocationService {
  constructor(
    @InjectModel('StockLocation')
    private readonly stockLocationModel: Model<StockLocation>,
  ) {}

  //create stock location
  async createNewLocation(
    createStockLocationDto: CreateStockLocationDto,
  ): Promise<StockLocation> {
    const newLocation = new this.stockLocationModel(createStockLocationDto);
    return newLocation.save();
  }

  async findAllLocation(): Promise<StockLocation[]> {
    const response = await this.stockLocationModel.find().sort({ name: 1 });
    return response;
  }

  async findLocationById(id: string): Promise<StockLocation> {
    const response = await this.stockLocationModel.findById(id);
    if (!response) {
      throw new NotFoundException('Stock Location Not Found');
    }
    return response;
  }

  async updateLocationById(
    id: string,
    updateStockLocationDto: UpdateStockLocationDto,
  ): Promise<StockLocation> {
    const response = await this.stockLocationModel.findByIdAndUpdate(
      id,
      updateStockLocationDto,
      { new: true },
    );
    return response;
  }

  async removeStockLocationById(id: string): Promise<any> {
    return await this.stockLocationModel.findByIdAndRemove(id);
  }

  async getStockByName(locationName: string): Promise<StockLocation> {
    return this.stockLocationModel.findOne({
      name: new RegExp(`^${locationName}$`, 'i'),
    });
  }
}
