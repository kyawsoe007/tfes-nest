import { ApiProperty } from '@nestjs/swagger';
export class FilterDto {
  @ApiProperty({
    required: false,
  })
  limit: number;

  @ApiProperty({ required: false })
  skip: number;

  @ApiProperty({ required: false, type: 'any' })
  filter: any;

  @ApiProperty({ required: false })
  searchText?: string;

  @ApiProperty({ required: false, type: 'any' })
  orderBy?: any;
}
