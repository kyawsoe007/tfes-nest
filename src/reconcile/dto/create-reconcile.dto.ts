import { ApiProperty } from '@nestjs/swagger';

export class CreateReconcileDto {
  @ApiProperty()
  number?: string;

  @ApiProperty()
  modelName: string;

  @ApiProperty()
  modelId: string;

  @ApiProperty()
  invoiceNumber: string;

  @ApiProperty()
  custId: string;

  @ApiProperty()
  credit: number;

  @ApiProperty()
  debit: number;

  @ApiProperty()
  reconciled: boolean;

  @ApiProperty()
  reconcileId: string;

  @ApiProperty()
  allocation: number;

  @ApiProperty()
  id: string;
}
