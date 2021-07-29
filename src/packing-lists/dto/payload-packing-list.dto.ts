import { ApiProperty } from '@nestjs/swagger';

export class PayloadPackingListDto {
  @ApiProperty({
    description: 'DeliveryId is originated from deliveryOrder _id',
  })
  deliveryId: string;
}
