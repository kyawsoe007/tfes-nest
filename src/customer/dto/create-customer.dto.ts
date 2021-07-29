import { ApiProperty } from '@nestjs/swagger';
export class CreateCustomerDto {
  @ApiProperty({ required: false, type: 'string' })
  cusNo: string;
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
  cusPIC: string;
  @ApiProperty({ required: false, type: 'string' })
  cusPICtel1a: string;
  @ApiProperty({ required: false, type: 'string' })
  cusPICtel1b: string;
  @ApiProperty({ required: false, type: 'string' })
  cusPICMobile1a: string;
  @ApiProperty({ required: false, type: 'string' })
  cusPICMobile1b: string;
  @ApiProperty({ required: false, type: 'string' })
  cusPICEmail: string;

  @ApiProperty({ required: false, type: 'string' })
  acctPIC: string;
  @ApiProperty({ required: false, type: 'string' })
  acctPICtel1a: string;
  @ApiProperty({ required: false, type: 'string' })
  acctPICtel1b: string;
  @ApiProperty({ required: false, type: 'string' })
  acctPICMobile1a: string;
  @ApiProperty({ required: false, type: 'string' })
  acctPICMobile1b: string;
  @ApiProperty({ required: false, type: 'string' })
  acctPICEmail: string;

  @ApiProperty({ required: false, type: 'string' })
  billingAddress: string;
  @ApiProperty({ required: false, type: 'string' })
  billingCountry: string;
  @ApiProperty({ required: false, type: 'string' })
  delAddress: string;

  @ApiProperty({ required: false, type: 'any' })
  salesPic: any;
  @ApiProperty({ required: false, type: 'any' })
  incoterm: any;
  @ApiProperty({ required: false, type: 'any' })
  paymentTerm: any;
  @ApiProperty({ required: false, type: 'any' })
  creditLimit: any;
  @ApiProperty({ required: false, type: 'any' })
  creditTerm: any;
  @ApiProperty({ required: false, type: 'any' })
  downPayment: any;
  @ApiProperty({ required: false, type: 'any' })
  billingCurrency: any;
  @ApiProperty({ required: false, type: 'any' })
  gstReq: any;
}
