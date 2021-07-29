import { ApiProperty } from '@nestjs/swagger';

export class PayloadDeliveryOrder {
  @ApiProperty({
    description: 'this is salesorder _id',
  })
  orderId: string;
}
