import { CreatePaymentDepositDto } from './create-payment-deposit.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdatePaymentDepositDto extends PartialType(CreatePaymentDepositDto) {}