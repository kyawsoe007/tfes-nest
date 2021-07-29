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

export enum PruchaseStatusEnumDto {
  OPEN = 'open',
  REQUEST = 'Approval requested',
  DRAFT = 'draft',
  CANCELLED = 'cancelled',
  PARTIAL = 'partial',
  CLOSED = 'closed',
  ERROR_STATUS = 'error status',
}

export enum InvStatusEnumDto {
  INVOICED = 'invoiced',
}

export class PurchaseOrderItemsDto {
  @IsOptional()
  SN: number;

  // @IsMongoId()
  // @ApiProperty()
  // sku: string;
  @ApiProperty()
  productId: string;

  // @IsString()
  @ApiProperty()
  suppRef: string;

  // @IsString()
  @ApiProperty()
  description: string;

  // @IsNumber()
  @ApiProperty()
  qty: number;

  // @IsNumber()
  @ApiProperty()
  unitPrice: number;

  // @IsNumber()
  @ApiProperty()
  extPrice: number;

  @IsOptional()
  uom: string;
}

export class CreatePurchaseDto {
  @ApiProperty()
  createdDate: Date;

  @ApiProperty()
  exportLocal: string;

  @ApiProperty()
  poNumber: string;

  // @IsString()
  @ApiProperty()
  purchasePic: string;

  // @IsString()
  @ApiProperty()
  suppNo: string;

  // @IsString()
  @ApiProperty()
  name: string;

  // @IsString()
  @ApiProperty()
  address: string;

  // @IsString()
  @ApiProperty()
  telNo: string;

  // @IsString()
  @ApiProperty()
  faxNo: string;

  // @IsString()
  @ApiProperty()
  buyerName: string;

  // @IsString()
  @ApiProperty()
  buyerEmail: string;

  // @IsString()
  @IsOptional()
  purRef: string;

  // @IsString()
  @ApiProperty()
  delAddress: string;

  @ApiProperty()
  delDate: string;

  // @IsMongoId()
  @ApiProperty()
  paymentTerm: string; // Dropdown

  // @IsMongoId()
  @ApiProperty()
  currency: string; // Dropdown

  // @IsMongoId()
  @ApiProperty()
  incoterm: string; // Dropdown

  // Status
  // @IsString()
  // @IsOptional()
  @ApiProperty()
  status: PruchaseStatusEnumDto;

  // Added static data for reporting
  // @IsNumber()
  @ApiProperty()
  discount: number;

  @ApiProperty()
  discountAmount: number;

  @ApiProperty()
  subTotal: number;

  // @IsNumber()
  @ApiProperty()
  total: number;

  @ApiProperty()
  unitPrice: number;

  @ApiProperty()
  remarks: string;

  @ApiProperty()
  location: string;

  // @IsNumber()
  @ApiProperty()
  gst: number;

  @ApiProperty()
  gstAmount: number;

  // backend processing
  isApprove: boolean;
  approvedBy: string;
  currencyRate: number;
  quoRef: string;
  invStatus: InvStatusEnumDto;
  isPercentage: boolean;
  discountName: string;
  @ApiProperty()
  purchaseType: string;

  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemsDto)
  purchaseOrderItems: PurchaseOrderItemsDto[];
}
