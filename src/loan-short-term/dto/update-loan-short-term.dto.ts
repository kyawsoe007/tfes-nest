import { PartialType } from '@nestjs/mapped-types';
import { CreateLoanShortTermDto } from './create-loan-short-term.dto';

export class UpdateLoanShortTermDto extends PartialType(
  CreateLoanShortTermDto,
) {}
