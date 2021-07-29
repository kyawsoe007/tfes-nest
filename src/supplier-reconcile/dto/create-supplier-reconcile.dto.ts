import { ApiProperty } from '@nestjs/swagger';

export class CreateSupplierReconcileDto {
  @ApiProperty()
  modelName: string;

  @ApiProperty()
  modelId: string;

  @ApiProperty()
  invoiceNumber: string;

  @ApiProperty()
  suppId: string;

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
