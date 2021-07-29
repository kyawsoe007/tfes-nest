import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { LoanLongTermService } from './loan-long-term.service';
import { CreateLoanLongTermDto } from './dto/create-loan-long-term.dto';
import { UpdateLoanLongTermDto } from './dto/update-loan-long-term.dto';
import { LoanLongTerm } from './loan-long-term.interface';
import { ValidateObjectId } from '../shared/validate-object-id.pipes';

@Controller('loan-long-term')
export class LoanLongTermController {
  constructor(private readonly loanLongTermService: LoanLongTermService) {}

  @Post()
  async create(
    @Body() createLoanLongTermDto: CreateLoanLongTermDto,
  ): Promise<LoanLongTerm> {
    return await this.loanLongTermService.create(createLoanLongTermDto);
  }

  @Get()
  async findAll(): Promise<LoanLongTerm[]> {
    return await this.loanLongTermService.findAll();
  }

  @Get(':id')
  async findOne(
    @Param('id', new ValidateObjectId()) id: string,
  ): Promise<LoanLongTerm> {
    return await this.loanLongTermService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', new ValidateObjectId()) id: string,
    @Body() updateLoanLongTermDto: UpdateLoanLongTermDto,
  ): Promise<LoanLongTerm> {
    return await this.loanLongTermService.update(id, updateLoanLongTermDto);
  }

  @Delete(':id')
  async remove(@Param('id', new ValidateObjectId()) id: string): Promise<void> {
    return await this.loanLongTermService.remove(id);
  }
}
