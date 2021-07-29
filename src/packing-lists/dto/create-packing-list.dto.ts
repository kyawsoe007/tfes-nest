import { ApiProperty } from '@nestjs/swagger';

export enum PackinglistStatus {
  OPEN = 'open',
  DRAFT = 'draft',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
}
export enum PackItemStatus {
  OPEN = 'open',
  COMPLETED = 'completed',
}

export class PackItemsDto {
  @ApiProperty()
  container: string;

  @ApiProperty()
  packItemStatus: PackItemStatus;

  // @IsNumber()
  @ApiProperty()
  qty: number;

  runningNum: number;

  @ApiProperty()
  sku: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  measurement: string;
  @ApiProperty()
  weight: string;

  @ApiProperty()
  workItemId: string;

  @ApiProperty()
  hsCode: string;

  @ApiProperty()
  cooCode: string;

  @ApiProperty()
  uom: string;
}

export class PackagingTypeDTO {
  @ApiProperty()
  container: string;
  @ApiProperty()
  measurement: string;
  @ApiProperty()
  weight: string;
  @ApiProperty()
  cooCode: string;
  @ApiProperty()
  hsCode: string;
}

export class CreatePackingListDto {
  @ApiProperty()
  completedDate: Date;

  @ApiProperty()
  soNumber: string;

  @ApiProperty()
  deliveryId: string;

  @ApiProperty()
  workOrderId: string;

  @ApiProperty()
  packingNum: string;
  // @IsString()
  @ApiProperty()
  operationId: string;
  // @IsString()
  @ApiProperty()
  orderId: string;
  // @IsString()
  @ApiProperty()
  pickedBy: string;

  @ApiProperty()
  cooCode: string;

  @ApiProperty()
  hsCode: string;

  @ApiProperty()
  remark: string;

  @ApiProperty()
  soDelRemark: string;

  // @IsString()
  @ApiProperty()
  packinglistStatus: PackinglistStatus;

  @ApiProperty({ type: () => [PackItemsDto] })
  packItems: PackItemsDto[];

  @ApiProperty({ type: () => [PackagingTypeDTO] })
  packagingType: PackagingTypeDTO[];
}
