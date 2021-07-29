import { ApiProperty } from '@nestjs/swagger';
export class CreateAccessRightDto {
  @ApiProperty({
    example: 'ops_manager',
    description:
      'director, ops_manager, sales, finance, general_manager, sales_admin',
  })
  name: string;

  @ApiProperty({
    example: ['quotation', 'sales_order', 'purchase_order', 'goods_delivered'],
    required: true,
  })
  access: string[];
  @ApiProperty()
  isManager: boolean;
}
