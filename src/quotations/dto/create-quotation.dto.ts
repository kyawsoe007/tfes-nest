import { IsOptional, IsNumber, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum ExpLocOptions {
  LOCAL = 'local',
  EXPORT = 'export',
}

export enum QuotationStatusEnumDto {
  ISSUED = 'issued',
  DRAFT = 'draft',
  WIN = 'win',
  LOSS = 'loss',
  DELAY = 'delay',
}

class BomListDto {
  @ApiProperty()
  productId: string;

  @ApiProperty()
  partNumberOne: string;

  @ApiProperty()
  descriptionTwo: string;

  @ApiProperty()
  grpOne: string;

  @ApiProperty()
  grpTwo: string;

  @ApiProperty()
  size: string;

  @ApiProperty()
  selOne: string;

  @ApiProperty()
  selTwo: string;

  @ApiProperty()
  brand: string;

  @ApiProperty()
  supp: string;

  @ApiProperty()
  unitSgd: string;

  @ApiProperty()
  qtyTwo: number;

  // @IsMongoId()
  // @ApiProperty()
  // sku: string;
}

export class SalesOrderItemsDto {
  // @IsNumber()
  @ApiProperty()
  SN: number;

  _id: string;

  // @IsMongoId()
  // @ApiProperty()
  // sku: string;

  // @IsString()
  @ApiProperty()
  custRef: string;

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

  @ApiProperty()
  bom: string;

  @ApiProperty()
  sku: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  uom: string;

  @ApiProperty()
  @ValidateNested({ each: true })
  @Type(() => BomListDto)
  BomList: BomListDto[];
}

export class CreateQuotationDto {
  @ApiProperty()
  discountName: string;

  @ApiProperty()
  createdDate: Date;

  // @ApiProperty({ enum: ['local', 'export'], default: 'local' })
  // @IsEnum(() => ExpLocOptions)
  // @IsEnum(ExpLocOptions)
  @ApiProperty({
    description: `acceptable insert value either "local" or "export" only`,
  })
  exportLocal: string;

  // @IsString()
  @ApiProperty()
  salesPic: string;

  @ApiProperty()
  remarks: string;

  // @IsString()
  @ApiProperty()
  custNo: string;

  // @IsString()
  @ApiProperty()
  custName: string;

  @ApiProperty()
  custId: string;

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
  quoRef: string;

  // @IsString()
  @ApiProperty()
  delAddress: string;

  // @IsMongoId()
  @ApiProperty()
  paymentTerm: string; // Dropdown

  // @IsMongoId()
  @ApiProperty()
  currency: string; // Dropdown

  currencyRate: number;

  // @IsMongoId()
  @ApiProperty()
  incoterm: string; // Dropdown

  // @IsString()
  @ApiProperty()
  paymentAddress: string;

  @ApiProperty({
    enum: ['draft', 'open', 'win', 'loss', 'delay'],
  })
  status: QuotationStatusEnumDto;

  //Convert
  @ApiProperty()
  isConverted: boolean;

  // Added static data for reporting
  // @IsNumber()
  @ApiProperty()
  @IsNumber()
  discount: number;

  // @IsNumber()
  @ApiProperty()
  total: number;

  // @IsNumber()
  @ApiProperty()
  gst: number;

  // @IsNumber()
  @ApiProperty()
  downPayment: number;

  @ValidateNested({ each: true })
  @Type(() => SalesOrderItemsDto)
  salesOrderItems: SalesOrderItemsDto[];

  @ApiProperty()
  leadTime: string;

  @ApiProperty()
  deliveryRemark: string;

  @ApiProperty()
  custPoNum: string;

  @ApiProperty()
  prices: string;

  @ApiProperty()
  validity: string;

  @ApiProperty()
  sku: string;

  @ApiProperty()
  discountAmt: number;

  @ApiProperty()
  subTotalAmt: number;

  @ApiProperty()
  gstAmt: number;

  @ApiProperty()
  header: string;

  @ApiProperty()
  box: string;

  @ApiProperty()
  workScope: string;

  @ApiProperty()
  isPercentage: boolean;

  //@ApiProperty()
  file:string;

  // @ApiProperty()
  // paymentId: string;

  // @IsEnum(ImpExp)
  // @ApiProperty()
  // @IsString()
  // impExp: string;
}
