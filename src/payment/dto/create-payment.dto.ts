import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty()
  paymentDate:Date;

  @ApiProperty()
  paymentNo: string;

  @ApiProperty()
  custId: string;

  @ApiProperty()
  custName: string;

  @ApiProperty()
  custNo: string;

  @ApiProperty()
  invoices: any;

  @ApiProperty()
  creditNotes: any;

  @ApiProperty()
  draftInvoices: any;

  @ApiProperty()
  draftCreditNotes: any;

  @ApiProperty()
  modelId: string;

  @ApiProperty()
  period: string;

  @ApiProperty()
  memo: string;

  @ApiProperty()
  paymentRef: string;

  @ApiProperty()
  paymentMethod: string;

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
