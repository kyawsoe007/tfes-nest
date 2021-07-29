import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsMongoId,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { ApiOAuth2, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum ExpLocOptions {
  LOCAL = 'local',
  EXPORT = 'export',
}

export enum InvoiceStatusEnum {
  DRAFT = 'draft',
  UNPAID = 'unpaid',
  PARTIAL = 'partial',
  PAID = 'paid',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
  CONFIRMED = 'confirmed',
}

class SaleOrderItemsDto {
  @ApiProperty()
  SN: number;

  @ApiProperty()
  custRef: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  qty: number;

  @ApiProperty()
  unitPrice: number;

  @ApiProperty()
  extPrice: number;

  @ApiProperty()
  account: string;
}

export class CreateInvoiceDto {
  invoiceNumber: string;
  soNumber: string;
  salesId: string;
  journalEntryId: string;

  toggleGenerateWO: boolean;
  toggleGeneratePO: boolean;

  @ApiProperty()
  account: string;

  @ApiProperty()
  journal: string;

  @ApiProperty()
  invoiceDate: Date;

  @ApiProperty()
  custNo: string;

  @ApiProperty()
  exportLocal: string;

  @ApiProperty()
  custId: string;

  @ApiProperty()
  custName: string;

  @ApiProperty()
  address: string;

  @ApiProperty()
  telNo: string;

  @ApiProperty()
  faxNo: string;

  @ApiProperty()
  buyerName: string;

  @ApiProperty()
  buyerEmail: string;

  @ApiProperty()
  poNumber: string;

  @ApiProperty()
  quotation: string;

  @ApiProperty()
  delAddress: string;

  @ApiProperty()
  paymentTerm: string; // Dropdown

  @ApiProperty()
  currency: string; // Dropdown

  @ApiProperty()
  currencyRate: number;

  @ApiProperty()
  paymentAddress: string;

  // isDraft / isConfirmed
  @ApiProperty()
  status: InvoiceStatusEnum;

  // Added static data for reporting
  @ApiProperty()
  discount: string;

  @ApiProperty()
  discountAmount: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  grandTotal: number;

  @ApiProperty()
  gst: number;

  @ApiProperty()
  downPayment: number;

  @ValidateNested({ each: true })
  @Type(() => SaleOrderItemsDto)
  salesOrderItems: SaleOrderItemsDto[];
  _id: string;
}
