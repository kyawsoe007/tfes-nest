import { PartialType } from '@nestjs/mapped-types';
import { CreateCreditLimitDto } from './create-credit-limit.dto';

export class UpdateCreditLimitDto extends PartialType(CreateCreditLimitDto) {}
