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
// import { ValidateObjectId } from 'src/shared/validate-object-id.pipes';
import { Currency } from './currencies.interface';
import { CurrenciesService } from './currencies.service';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';

@ApiTags('Currencies')
@Controller('currencies')
export class CurrenciesController {
  constructor(private readonly currenciesService: CurrenciesService) {}

  @Post()
  async create(@Body() createCurrencyDto: CreateCurrencyDto) {
    const result = await this.currenciesService.create(createCurrencyDto);
    return result;
    // console.log(result);
    // return res.status(HttpStatus.OK).json({
    //   message: 'Post has been submitted successfully!',
    //   currency: result,
    // });
  }

  @Get()
  async findAll(): Promise<Currency[]> {
    const result = await this.currenciesService.findAll();
    return result;
  }

  @Get('allrates')
  async findAllRates(): Promise<Currency[]>{
    const result = await this.currenciesService.findAllRates();
    return result;
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Currency> {
    const result = await this.currenciesService.findOne(id);
    if (!result) {
      throw new NotFoundException('Currency ID does not exist!');
    }
    return result;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCurrencyDto: UpdateCurrencyDto,
  ): Promise<Currency> {
    const result = await this.currenciesService.update(id, updateCurrencyDto);
    if (!result) {
      throw new NotFoundException('Currency ID does not exist!');
    }
    return result;
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Currency> {
    return await this.currenciesService.remove(id);
  }
}
