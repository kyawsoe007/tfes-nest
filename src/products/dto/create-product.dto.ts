import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
export class CreateProductDto {
  @ApiProperty({ required: false, type: 'string' })
  readonly partNumber: string;
  @ApiProperty({ required: false, type: 'string' })
  readonly description: string;
  @ApiProperty({ required: false, type: 'number' })
  readonly averagePrice: number;
  @ApiProperty({ required: false, type: 'number' })
  readonly listPrice: number;
  @ApiProperty({ required: false, type: 'string' })
  readonly remarks: string;
  @ApiProperty({ required: false, type: 'any' })
  readonly unitCost: number;
  @ApiProperty({ required: false, type: 'any' })
  readonly sku: any;
  @ApiProperty({ required: false, type: 'any' })
  readonly brand: any;
  @ApiProperty({ required: false, type: 'any' })
  readonly grpOne: any;
  @ApiProperty({ required: false, type: 'any' })
  readonly grpTwo: any;
  @ApiProperty({ required: false, type: 'any' })
  readonly currency: any;
  @ApiProperty({ required: false, type: 'any' })
  readonly selOne: any;
  @ApiProperty({ required: false, type: 'any' })
  readonly selTwo: any;
  @ApiProperty({ required: false, type: 'any' })
  readonly size: any;
  @ApiProperty({ required: false, type: 'any' })
  readonly material: any;
  @ApiProperty({ required: false, type: 'any' })
  readonly uom: any;
  @ApiProperty({ required: false, type: 'any' })
  readonly supp1: any;
  @ApiProperty({ required: false, type: 'any' })
  readonly supp2: any;
  @ApiProperty({ required: false, type: 'any' })
  readonly supp3: any;
  @ApiProperty({ required: false, type: 'any' })
  readonly supp4: any;
  @ApiProperty({ required: false, type: 'any' })
  readonly supp5: any;
  @ApiProperty({ required: false, type: 'any' })
  readonly location: any;
  @ApiProperty({ required: false, type: 'any' })
  isFreight: boolean;
}
