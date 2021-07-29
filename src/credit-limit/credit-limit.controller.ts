import { CreditLimit } from 'src/credit-limit/credit-limit.interface';
import { ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
} from '@nestjs/common';
import { CreditLimitService } from './credit-limit.service';
import { CreateCreditLimitDto } from './dto/create-credit-limit.dto';
import { UpdateCreditLimitDto } from './dto/update-credit-limit.dto';

@ApiTags('Credit-limit')
@Controller('credit-limit')
export class CreditLimitController {
  constructor(private readonly creditLimitService: CreditLimitService) {}

  @Post()
  create(@Body() createCreditLimitDto: CreateCreditLimitDto) {
    return this.creditLimitService.create(createCreditLimitDto);
  }

  @Get()
  findAll() {
    return this.creditLimitService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.creditLimitService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCreditLimitDto: UpdateCreditLimitDto,
  ): Promise<CreditLimit> {
    return this.creditLimitService.update(id, updateCreditLimitDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.creditLimitService.remove(id);
  }
}
