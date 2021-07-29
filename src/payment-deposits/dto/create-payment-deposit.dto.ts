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
  import { InvoiceStatusEnum } from 'src/invoices/dto/create-invoice.dto';
  
  export enum ExpLocOptions {
    LOCAL = 'local',
    EXPORT = 'export',
  }
  
  class SaleOrderItemsDto {
    @ApiProperty()
    SN: number;
  
    @ApiProperty()
    custRef: string;
  
    @ApiProperty()
    account: string;
  
    @ApiProperty()
    description: string;
  
    @ApiProperty()
    qty: number;
  
    @ApiProperty()
    unitPrice: number;
  
    @ApiProperty()
    extPrice: number;
  
    @ApiProperty()
    gst: number;
  
    @ApiProperty()
    gstAmount: number;
  
    @ApiProperty()
    bom: string;
    BomList: any;
  }
  
  export class CreatePaymentDepositDto {
    depositNumber: string;
    soNumber: string;
  
    toggleGenerateWO: boolean;
    toggleGeneratePO: boolean;
  
    @ApiProperty()
    account: string;
  
    @ApiProperty()
    journal: string;
  
    @ApiProperty()
    suppNo: string;

    @ApiProperty()
    custNo: string;
  
    @ApiProperty()
    exportLocal: string;
  
    @ApiProperty()
    suppId: string;

    @ApiProperty()
    custId: string;
  
    @ApiProperty()
    suppName: string;

    @ApiProperty()
    custName: string;
  
    @ApiProperty()
    invoiceDate: Date;

    @ApiProperty()
    depositType:string;
  
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
    quotation: string;
  
    @ApiProperty()
    delAddress: string;
  
    @ApiProperty()
    paymentTerm: string; // Dropdown
  
    @ApiProperty()
    currency: string; // Dropdown
  
    @ApiProperty()
    paymentAddress: string;
  
    // isDraft / isConfirmed
    @ApiProperty()
    status: InvoiceStatusEnum;
  
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
    _id: string;
  }
  