import { PartialType } from '@nestjs/mapped-types';
import { CreateCreditTermDto } from './create-credit-term.dto';

export class UpdateCreditTermDto extends PartialType(CreateCreditTermDto) {}
