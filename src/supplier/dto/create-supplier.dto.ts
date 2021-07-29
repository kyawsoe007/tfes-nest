import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';
export class CreateSupplierDto {
  @ApiProperty({ required: false, type: 'string' })
  suppId: string;
  @ApiProperty({ required: false, type: 'string' })
  name: string;
  @ApiProperty({ required: false, type: 'string' })
  nickname: string;
  @ApiProperty({ required: false, type: 'string' })
  address: string;
  @ApiProperty({ required: false, type: 'string' })
  country: string;
  @ApiProperty({ required: false, type: 'string' })
  tel1a: string;
  @ApiProperty({ required: false, type: 'string' })
  tel1b: string;
  @ApiProperty({ required: false, type: 'string' })
  fax1a: string;
  @ApiProperty({ required: false, type: 'string' })
  fax1b: string;
  @ApiProperty({ required: false, type: 'string' })
  salesPIC: string;
  @ApiProperty({ required: false, type: 'string' })
  salesPICtel1a: string;
  @ApiProperty({ required: false, type: 'string' })
  salesPICtel1b: string;
  @ApiProperty({ required: false, type: 'string' })
  salesPICMobile1a: string;
  @ApiProperty({ required: false, type: 'string' })
  salesPICMobile1b: string;
  @ApiProperty({ required: false, type: 'string' })
  salesPICEmail: string;
  @ApiProperty({ required: false, type: 'string' })
  acctPIC: string;
  @ApiProperty({ required: false, type: 'string' })
  acctPICtel1a: string;
  @ApiProperty({ required: false, type: 'string' })
  acctPICtel1b: string;
  @ApiProperty({ required: false, type: 'string' })
  acctPICMobile1a: string;
  @ApiProperty({ required: false, type: 'string' })
  acctPICEmail: string;
  @ApiProperty({ required: false, type: 'string' })
  delAddress: string;
  @ApiProperty({ required: false, type: 'string' })
  delCountry: string;
  @ApiProperty({ required: false, type: 'any' })
  tfesPIC: any;
  @ApiProperty({ required: false, type: 'any' })
  incoterm: any;
  @ApiProperty({ required: false, type: 'any' })
  downPayment: any;
  @ApiProperty({ required: false, type: 'any' })
  billingCurrent: any;
  @ApiProperty({ required: false, type: 'any' })
  gstReq: any;
}
