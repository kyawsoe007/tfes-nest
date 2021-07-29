import { ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  NotFoundException,
} from '@nestjs/common';
import { CountriesService } from './countries.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { Country } from './countries.interface';

@ApiTags('Countries')
@Controller('countries')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Post()
  async create(@Body() createCountryDto: CreateCountryDto) {
    const result = await this.countriesService.create(createCountryDto);
    return result;
  }

  @Get()
  async findAll(): Promise<Country[]> {
    const result = await this.countriesService.findAll();
    if (result.length < 1) {
      throw new NotFoundException('Country list is empty');
    }
    return result;
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Country> {
    const result = await this.countriesService.findOne(id);
    if (!result) {
      throw new NotFoundException('Country ID does not exist!');
    }
    return result;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCountryDto: UpdateCountryDto,
  ): Promise<Country> {
    const result = await this.countriesService.update(id, updateCountryDto);
    if (!result) {
      throw new NotFoundException('Country ID does not exist!');
    }
    return result;
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Country> {
    const result = await this.countriesService.remove(id);
    if (!result) {
      throw new NotFoundException('Country ID does not exist!');
    }
    return result;
  }
}
