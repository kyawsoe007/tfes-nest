import { CreateInvoiceDto } from './create-invoice.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) {}
