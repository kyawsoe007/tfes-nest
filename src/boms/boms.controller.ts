import { ApiTags } from '@nestjs/swagger';
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
import { BomsService } from './boms.service';
import { CreateBomDto } from './dto/create-bom.dto';
import { UpdateBomDto } from './dto/update-bom.dto';
import { Bom } from './boms.interface';

@ApiTags('BOMs')
@Controller('boms')
export class BomsController {
  constructor(private readonly bomsService: BomsService) {}

  // @Post()
  // async create(@Body() createBomDto: CreateBomDto) {
  //   const result = await this.bomsService.create(createBomDto);
  //   return result;
  // }

  @Post()
  async create(bomData: { productList: any[] }) {
    const result = await this.bomsService.create(bomData);
    return result;
  }

  @Get()
  async findAll(): Promise<Bom[]> {
    const result = await this.bomsService.findAll();
    if (result.length < 1) {
      throw new NotFoundException('Bom list is empty');
    }
    return result;
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Bom> {
    const result = await this.bomsService.findOne(id);
    if (!result) {
      throw new NotFoundException('Bom ID does not exist!');
    }
    return result;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateBomDto: UpdateBomDto,
  ): Promise<Bom> {
    const result = await this.bomsService.update(id, updateBomDto);
    if (!result) {
      throw new NotFoundException('Bom ID does not exist!');
    }
    return result;
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<any> {
    return await this.bomsService.remove(id);
  }
}
