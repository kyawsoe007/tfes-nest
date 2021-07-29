import { PartialType } from '@nestjs/mapped-types';
import { CreateBillingCurrencyDto } from './create-billing-currency.dto';

export class UpdateBillingCurrencyDto extends PartialType(
  CreateBillingCurrencyDto,
) {}
