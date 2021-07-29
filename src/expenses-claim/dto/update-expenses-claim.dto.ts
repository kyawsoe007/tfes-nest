import { PartialType } from '@nestjs/mapped-types';
import { CreateExpensesClaimDto } from './create-expenses-claim.dto';

export class UpdateExpensesClaimDto extends PartialType(
  CreateExpensesClaimDto,
) {}
