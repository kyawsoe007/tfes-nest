import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum ExpLocOptions {
  LOCAL = 'local',
  EXPORT = 'export',
}

export enum SalesStatusEnumDto {
  OPEN = 'open',
  DRAFT = 'draft',
  CANCELLED = 'cancelled',
  DELIVERED = 'delivered',
  INVOICED = 'invoiced',
  PARTIALINVOICED = 'partial invoiced',
  CLOSED = 'closed',

  // sku: { type: mongoose.Schema.Types.ObjectId, ref: 'Sku' },
  // product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product'},
  // qty: { type: Number },
  // totalWorkQty: { type: Number },
}

class BomListDto {
  @ApiProperty()
  product: string;

  @ApiProperty()
  sku: string;

  // @ApiProperty()
  // partNumberOne: string;

  @ApiProperty()
  descriptionTwo: string;

  // @ApiProperty()
  // grpOne: string;

  // @ApiProperty()
  // grpTwo: string;

  // @ApiProperty()
  // size: string;

  // @ApiProperty()
  // selOne: string;

  // @ApiProperty()
  // selTwo: string;

  // @ApiProperty()
  // brand: string;

  // @ApiProperty()
  // supp: string;

  @ApiProperty()
  unitSgd: number;

  @ApiProperty()
  qtyTwo: number;

  unitCost: number;
}

export class SaleOrderItemsDto {
  _id: string;

  @ApiProperty()
  SN: number;

  @ApiProperty()
  sku: string;

  @ApiProperty()
  productId: string;

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
  bom: string;

  @ApiProperty()
  uom: string;

  @ApiProperty()
  @ValidateNested({ each: true })
  @Type(() => BomListDto)
  BomList: BomListDto[];
}

export class CreateUploadData {
  @ApiProperty()
  soNumber: string;

  @ApiProperty()
  versionNum: number;

  @ApiProperty()
  date: Date;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  woStatus: string;

  @ApiProperty()
  doStatus: string;
}
export class CreateSalesOrderDto {
  //createDate: Date;
  // @ApiProperty()
  // @IsOptional()
  // @IsEnum(ExpLocOptions)
  @ApiProperty({
    description: `acceptable insert value either "local" or "export" only`,
  })
  exportLocal: ExpLocOptions;

  _id: string;

  soNumber: string;

  @ApiProperty()
  createdDate: Date;

  toggleGenerateWO: boolean;
  toggleGeneratePO: boolean;

  @ApiProperty()
  salesPic: string;

  @ApiProperty()
  custNo: string;

  @ApiProperty()
  discountName: string;

  @ApiProperty()
  custId: string;

  @ApiProperty()
  custPoNum: string;

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
  quoRef: string;

  @ApiProperty()
  delAddress: string;

  @ApiProperty()
  discountAmt: number;
  @ApiProperty()
  subTotalAmt: number;
  @ApiProperty()
  gstAmt: number;

  @ApiProperty()
  paymentTerm: string; // Dropdown

  @ApiProperty()
  currency: string; // Dropdown

  @ApiProperty()
  currencyRate: number;

  @ApiProperty()
  incoterm: string; // Dropdown

  @ApiProperty()
  paymentAddress: string;

  @ApiProperty()
  leadTime: string;

  @ApiProperty()
  deliveryRemark: string;

  @ApiProperty()
  prices: string;

  @ApiProperty()
  validity: string;

  doCount: number;

  ciplNum: string;

  // isDraft / isConfirmed

  @ApiProperty({
    enum: [
      'draft',
      'open',
      'cancelled',
      'delivered',
      'invoiced',
      'PartialInvoiced',
      'closed',
    ],
  })
  status: SalesStatusEnumDto;

  @ApiProperty()
  remarks: string;

  // isInitialVer / isNewVersion
  @ApiProperty()
  latestSalesOrder: boolean;

  // Added static data for reporting
  @ApiProperty()
  discount: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  gst: number;

  @ApiProperty()
  downPayment: number;

  @ValidateNested({ each: true })
  @Type(() => SaleOrderItemsDto)
  salesOrderItems: SaleOrderItemsDto[];

  purchaseId: string;

  freightAmount: number;

  file: string;
  isPercentage: boolean;

  // @ApiProperty()
  // @IsBoolean()
  // paymentId: string;

  // @IsEnum(ImpExp)
  // @ApiProperty()
  // @IsString()
  // impExp: string;
}
