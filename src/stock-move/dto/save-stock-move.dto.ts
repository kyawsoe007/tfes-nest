import { ApiProperty } from '@nestjs/swagger';
export class MoveDto {
  @ApiProperty({
    required: false,
  })
  date?: Date;

  @ApiProperty({ required: false })
  lines?: any;

  @ApiProperty({ required: false, type: 'any' })
  moveNo: string;

  @ApiProperty({ required: false })
  operationId?: string;

  @ApiProperty({ required: false, type: 'any' })
  operationNo?: string;

  destinationId?: string;
}
