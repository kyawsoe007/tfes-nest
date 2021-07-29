import { PartialType } from '@nestjs/mapped-types';
import { CreateLoanLongTermDto } from './create-loan-long-term.dto';

export class UpdateLoanLongTermDto extends PartialType(CreateLoanLongTermDto) {}
