import { ApiProperty } from '@nestjs/swagger';

export class CreatePurchaseListTempDto {
  @ApiProperty()
  salesOrderId: string;
  @ApiProperty()
  description: string;
  @ApiProperty()
  productId: string;
  @ApiProperty()
  sku: string;
  @ApiProperty()
  qty: number;
  @ApiProperty()
  isChecked: boolean;
  isLatest?: boolean;
  isPoSubmitted?: boolean;
  suppName?: string;
  suppId?: string;
}
