import { ApiProperty } from '@nestjs/swagger';
export class OnMergeSkusDto {
  @ApiProperty()
  skuIdMergeTo: string;
  @ApiProperty()
  skuIdMergeFrom: string;
}
