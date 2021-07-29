import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
} from '@nestjs/common';
import { StockOperationService } from './stock-operation.service';
import { CreateStockOperationDto } from './dto/create-stock-operation.dto';
import { ApiTags } from '@nestjs/swagger';
import { StockOperation } from './stock-operation.interface';
import { FilterDto } from '../shared/filter.dto';
import { ValidateObjectId } from 'src/shared/validate-object-id.pipes';
import { Sku } from 'src/skus/skus.interface';
import { UpdateStockOperationDto } from './dto/update-stock-operation.dto';

@ApiTags('stock-operation')
@Controller('stock-operation')
export class StockOperationController {
  constructor(private readonly stockOperationService: StockOperationService) {}

  @Post()
  async create(
    @Body() createStockOperationDto: CreateStockOperationDto,
  ): Promise<StockOperation> {
    return await this.stockOperationService.createNewOperation(
      createStockOperationDto,
    );
  }

  @Get()
  async findAll(): Promise<StockOperation[]> {
    const result = await this.stockOperationService.findAll();
    return result;
  }

  @Get(':id')
  async findById(
    @Param('id', new ValidateObjectId()) id: string,
  ): Promise<StockOperation> {
    const result = await this.stockOperationService.findById(id);
    return result;
  }

  @Post('getfilters')
  async getfilters(@Body() query: FilterDto) {
    const result = await this.stockOperationService.getfilters(query);
    return result;
  }

  @Post('createInternalMove')
  async createInternalMove(
    @Body() createStockOperation: CreateStockOperationDto,
  ): Promise<Sku> {
    return await this.stockOperationService.createInternalMove(
      createStockOperation,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateStockOperationDto: UpdateStockOperationDto,
  ) {
    return this.stockOperationService.update(id, updateStockOperationDto);
  }
  @Post('add-stock')
  async addStock(@Body() createStockOperationDto: CreateStockOperationDto) {
    return await this.stockOperationService.addStock(createStockOperationDto);
  }

  @Post('remove-stock')
  async removeStock(@Body() createStockOperationDto: CreateStockOperationDto) {
    return await this.stockOperationService.removeStock(
      createStockOperationDto,
    );
  }
}
