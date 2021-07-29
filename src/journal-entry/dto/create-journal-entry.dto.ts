import { ApiProperty } from '@nestjs/swagger';

export class JournalItem {
  @ApiProperty()
  account: string;

  @ApiProperty()
  amountCurrency: number;

  @ApiProperty()
  credit: number;

  @ApiProperty()
  debit: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  dueDate: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  partialReconcile: string;

  @ApiProperty()
  partner: string;

  @ApiProperty()
  reconcile: string;

  @ApiProperty()
  taxAmount: number;

  @ApiProperty()
  reference: string;
}
export class CreateJournalEntryDto {
  @ApiProperty()
  status: string;

  @ApiProperty()
  journalEntryNum: string;

  @ApiProperty()
  period?: string;

  @ApiProperty()
  reference: string;

  @ApiProperty()
  remarks: string;

  @ApiProperty()
  journalValue: string;

  @ApiProperty()
  totalDebit: number;

  @ApiProperty()
  totalCredit: number;

  @ApiProperty()
  toReview: boolean;

  @ApiProperty({ type: () => [JournalItem] })
  journalItems: JournalItem[];

  @ApiProperty()
  entryDate: Date;

  @ApiProperty()
  modelId?: string;

  @ApiProperty()
  modelName?: string;
}
