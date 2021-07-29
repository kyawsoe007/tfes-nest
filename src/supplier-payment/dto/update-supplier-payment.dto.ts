import { PartialType } from '@nestjs/mapped-types';
import { CreateSupplierPaymentDto } from './create-supplier-payment.dto';

export class UpdateSupplierPaymentDto extends PartialType(CreateSupplierPaymentDto) {}
