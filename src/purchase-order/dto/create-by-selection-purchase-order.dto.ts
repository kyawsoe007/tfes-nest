import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

export class CreatePurchaseBySelectionDto {
  @ApiProperty()
  purchasePic: string; // Not Required From from Frontend
  @ApiProperty()
  salesOrderId: string; // Required ===
  suppId: string;
  suppNo: string; // Not Required From from Frontend
  name: string;
  address: string;
  telNo: string;
  faxNo: string;
  incoTerm: string;
  buyerName: string;
  buyerEmail: string;
  delAddress: string;
  currency: string;
  discountAmount: number;

  @ValidateNested({ each: true })
  @Type(() => PurchaseItemBySelectionDto)
  purchaseOrderItems: PurchaseItemBySelectionDto[];
}

export class PurchaseItemBySelectionDto {
  @ApiProperty()
  description: string;
  @ApiProperty()
  productId: string;
  @ApiProperty()
  sku: string;
  @ApiProperty()
  qty: number;
  @ApiProperty()
  unitPrice: number;
  @ApiProperty()
  suppId: string;
  suppName: string;
  _id?: string;
  isChecked?: boolean;
  isPoSubmitted?: boolean;
  uom?: string;
}
