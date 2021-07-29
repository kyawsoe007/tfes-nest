import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StockLocationService } from './stock-location.service';
import { CreateStockLocationDto } from './dto/create-stock-location.dto';
import { UpdateStockLocationDto } from './dto/update-stock.location.dto';
import { StockLocation } from './stock-location.interface';
import { ValidateObjectId } from '../shared/validate-object-id.pipes';
import { Response } from 'express';

@ApiTags('stock-location')
@Controller('stock-location')
export class StockLocationController {
  constructor(private readonly stockLocationService: StockLocationService) {}

  @Post('create-new-location')
  async createNewLocation(
    @Body() createStockLocationDto: CreateStockLocationDto,
  ) {
    const response = await this.stockLocationService.createNewLocation(
      createStockLocationDto,
    );
    if (!response) {
      throw new NotFoundException('Location Not Found!');
    }
    return response;
  }

  @Get('get-all-location')
  async findAllLocation(): Promise<StockLocation[]> {
    const result = await this.stockLocationService.findAllLocation();
    return result;
  }

  @Get('get-location/:id')
  async findLocationById(
    @Param('id', new ValidateObjectId()) id: string,
  ): Promise<StockLocation> {
    const result = await this.stockLocationService.findLocationById(id);
    if (!result) {
      throw new NotFoundException('Stock Location does not exist!');
    }
    return result;
  }

  @Get('get-locationbyName/:name')
  async getStockByName(@Param('name') name: string): Promise<StockLocation> {
    const result = await this.stockLocationService.getStockByName(name);
    if (!result) {
      throw new NotFoundException('Stock Location does not exist!');
    }
    return result;
  }

  @Patch('update-location/:id')
  async updateStockLocationById(
    @Param('id', new ValidateObjectId()) id: string,
    @Body() updateStockLocationDto: UpdateStockLocationDto,
  ): Promise<StockLocation> {
    const result = await this.stockLocationService.updateLocationById(
      id,
      updateStockLocationDto,
    );
    if (!result) {
      throw new NotFoundException('Stock Location does not exist!');
    }
    return result;
  }

  @Delete('remove-location/:id')
  async removeStockLocationById(
    @Param('id', new ValidateObjectId()) id: string,
    @Res() response: Response,
  ): Promise<any> {
    const result = await this.stockLocationService.removeStockLocationById(id);

    if (!result) {
      throw new NotFoundException('Stock Location does not exist!');
    }
    return response.status(HttpStatus.OK).json({
      message: 'Stock Location has been deleted!',
    });
  }
}
