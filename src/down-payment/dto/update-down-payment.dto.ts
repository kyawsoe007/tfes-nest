import { PartialType } from '@nestjs/mapped-types';
import { CreateDownPaymentDto } from './create-down-payment.dto';

export class UpdateDownPaymentDto extends PartialType(CreateDownPaymentDto) {}
