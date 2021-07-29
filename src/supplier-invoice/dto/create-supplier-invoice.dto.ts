import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsMongoId,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum ExpLocOptions {
  LOCAL = 'local',
  EXPORT = 'export',
  MANUAL = 'manual',
}

export class SaleOrderItemsDto {
  @ApiProperty()
  SN: number;

  @ApiProperty()
  suppRef: string;

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

  @ApiProperty()
  expenseType: string;
}

export class CreateSupplierInvoiceDto {
  invoiceNumber: string;
  soNumber: string;

  toggleGenerateWO: boolean;
  toggleGeneratePO: boolean;

  @ApiProperty()
  salesPic: string;

  @ApiProperty()
  suppNo: string;

  @ApiProperty()
  suppId: string;

  @ApiProperty()
  suppName: string;

  @ApiProperty()
  account?: string;

  @ApiProperty()
  journal?: string;

  @ApiProperty()
  suppInvoiceNo?: string;

  @ApiProperty()
  invoiceDate: Date;

  @ApiProperty()
  exportLocal: string;

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
  currency?: string; // Dropdown

  @ApiProperty()
  currencyRate?: number;

  @ApiProperty()
  paymentAddress: string;

  // isDraft / isConfirmed
  @ApiProperty()
  status: string;

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
  gstAmount: number;

  @ApiProperty()
  downPayment: number;

  @ValidateNested({ each: true })
  @Type(() => SaleOrderItemsDto)
  salesOrderItems: SaleOrderItemsDto[];
  _id: string;

  @ApiProperty()
  claimId: string;
}
