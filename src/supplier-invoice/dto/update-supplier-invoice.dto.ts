import { PartialType } from '@nestjs/mapped-types';
import { CreateSupplierInvoiceDto } from './create-supplier-invoice.dto';

export class UpdateSupplierInvoiceDto extends PartialType(CreateSupplierInvoiceDto) {}
