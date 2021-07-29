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
import { SkusService } from './skus.service';
import { CreateSkusDto } from './dto/create-skus.dto';
import { UpdateSkusDto } from './dto/update-skus.dto';
import { Sku } from './skus.interface';
import { ApiTags } from '@nestjs/swagger';
import { ValidateObjectId } from '../shared/validate-object-id.pipes';
import { OnMergeSkusDto } from './dto/onMerge-skus.dto';

@ApiTags('Sku')
@Controller('skus')
export class SkusController {
  constructor(private readonly skusService: SkusService) {}

  @Post()
  async createSku(@Body() createSkusDto: CreateSkusDto): Promise<Sku> {
    return await this.skusService.createSku(createSkusDto);
  }

  // Fetch all dropdown group belongs to quotation page
  @Get('dropdown-group')
  async getAllSkuDropdownGroup() {
    const result = await this.skusService.getAllSkuDropdownGroup();
    if (!result) {
      throw new NotFoundException('Quotation dropdown group not found');
    }

    return result;
  }

  @Get()
  async findAllSku(): Promise<Sku[]> {
    const result = await this.skusService.findAllSku();
    return result;
  }

  @Get(':id')
  async findOneSku(@Param('id') id: string): Promise<any> {
    const result = await this.skusService.findOneSku(id);
    if (!result) {
      throw new NotFoundException('Sku Id does not exist!');
    }
    return result;
  }

  // For WO to get Location only
  async findOneSkuForWO(@Param('id') id: string): Promise<any> {
    const result = await this.skusService.findOneSkuForWO(id);
    if (!result) {
      throw new NotFoundException('Sku Id does not exist!');
    }
    return result;
  }

  @Patch(':id')
  async updateSku(
    @Param('id') id: string,
    @Body() updateSkusDto: UpdateSkusDto,
  ): Promise<Sku> {
    const result = await this.skusService.updateSku(id, updateSkusDto);
    if (!result) {
      throw new NotFoundException('Sku Id does not exist!');
    }
    return result;
  }

  @Delete(':id')
  async removeSku(@Param('id') id: string): Promise<Sku> {
    return await this.skusService.removeSku(id);
  }

  @Patch('/mergeSku/:productId')
  onMergeSku(
    @Param('productId', new ValidateObjectId()) productId: string,
    @Body() onMergeSkusDto: OnMergeSkusDto,
  ): Promise<any> {
    return this.skusService.onMergeSku(productId, onMergeSkusDto);
  }
}
