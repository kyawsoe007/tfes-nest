import { ApiProperty } from '@nestjs/swagger';

export class CreateSupplierPaymentDto {
  @ApiProperty()
  paymentDate:Date;
  
  @ApiProperty()
  paymentNo: string;

  @ApiProperty()
  suppId: string;

  @ApiProperty()
  suppName: string;

  @ApiProperty()
  suppNo: string;

  @ApiProperty()
  invoices: any;

  @ApiProperty()
  draftInvoices: any;

  @ApiProperty()
  draftDebitNotes: any;

  @ApiProperty()
  debitNotes:any;

  @ApiProperty()
  modelId: string;

  @ApiProperty()
  period: string;

  @ApiProperty()
  memo: string;

  @ApiProperty()
  paymentRef: string;

  @ApiProperty()
  paymentMethod?: string;

  @ApiProperty()
  shortTermPaymentId: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  total: number;

  @ApiProperty()
  currencyRate: number;

  _id: string;

  @ApiProperty()
  expenseAccount?: string;

  @ApiProperty()
  currencyAccount?: string;

  @ApiProperty()
  expenseAmount?: string;

  @ApiProperty()
  currencyLossAmount?: string;
}
