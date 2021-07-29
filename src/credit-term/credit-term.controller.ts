import { CreditTerm } from 'src/credit-term/credit-term.interface';
import { ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CreditTermService } from './credit-term.service';
import { CreateCreditTermDto } from './dto/create-credit-term.dto';
import { UpdateCreditTermDto } from './dto/update-credit-term.dto';

@ApiTags('Credit-term')
@Controller('credit-term')
export class CreditTermController {
  constructor(private readonly creditTermService: CreditTermService) {}

  @Post()
  create(@Body() createCreditTermDto: CreateCreditTermDto) {
    return this.creditTermService.create(createCreditTermDto);
  }

  @Get()
  findAll() {
    return this.creditTermService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.creditTermService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCreditTermDto: UpdateCreditTermDto,
  ):Promise<CreditTerm> {
    return this.creditTermService.update(id, updateCreditTermDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string):Promise<void> {
    return this.creditTermService.remove(id);
  }
}
