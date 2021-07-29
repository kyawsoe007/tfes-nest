import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { LoanShortTermService } from './loan-short-term.service';
import { CreateLoanShortTermDto } from './dto/create-loan-short-term.dto';
import { UpdateLoanShortTermDto } from './dto/update-loan-short-term.dto';
import { LoanShortTerm } from './loan-short-term.interface';
import { ValidateObjectId } from '../shared/validate-object-id.pipes';
import { FilterDto } from 'src/shared/filter.dto';

@Controller('loan-short-term')
export class LoanShortTermController {
  constructor(private readonly loanShortTermService: LoanShortTermService) {}

  @Post()
  async create(@Body() createLoanShortTermDto: CreateLoanShortTermDto) {
    return await this.loanShortTermService.create(createLoanShortTermDto);
  }

  /*
  @Get()
  async findAll(): Promise<LoanShortTerm[]> {
    return await this.loanShortTermService.findAll();
  }
  */

  @Post('getfilters')
  async getfilters(@Body() query: FilterDto) {
    const result = await this.loanShortTermService.getfilters(query);
    return result;
  }


  @Get(':id')
  async findOne(
    @Param('id', new ValidateObjectId()) id: string,
  ): Promise<LoanShortTerm> {
    return await this.loanShortTermService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', new ValidateObjectId()) id: string,
    @Body() updateLoanShortTermDto: UpdateLoanShortTermDto,
  ): Promise<LoanShortTerm> {
    return await this.loanShortTermService.update(id, updateLoanShortTermDto);
  }

  @Delete(':id')
  async remove(@Param('id', new ValidateObjectId()) id: string): Promise<void> {
    return await this.loanShortTermService.remove(id);
  }
}
