import { ApiProperty } from '@nestjs/swagger';

export class OnResetWoItemDto {
  @ApiProperty({ type: () => [ResetWoItemsArrDto] })
  workOrderItems: ResetWoItemsArrDto[];
}

export class ResetWoItemsArrDto {
  @ApiProperty()
  _id?: string;
  @ApiProperty()
  woItemId: string;
  @ApiProperty()
  productId: string;
  @ApiProperty()
  bom: string;
}
