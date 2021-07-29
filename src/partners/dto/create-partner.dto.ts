import { ApiProperty } from '@nestjs/swagger';

export enum PartnerTypeEnumDto {
  Customer = 'Customer',
  Supplier = 'Supplier',
  Employee = 'Employee',
}
export class CreatePartnerDto {
  @ApiProperty()
  name: string;
  @ApiProperty()
  modelRef: PartnerTypeEnumDto;
  @ApiProperty()
  modelId: string;
}
