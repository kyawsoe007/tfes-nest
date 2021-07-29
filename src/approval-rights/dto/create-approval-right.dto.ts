import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class CreateApprovalRightDto {
  @ApiProperty()
  @IsString()
  type: string;
  @ApiProperty()
  @IsInt()
  minAmt: number;
  @ApiProperty()
  @IsInt()
  maxAmt: number;
  @ApiProperty({
    example: ['director', 'manager'],
    required: true,
  })
  roles: string[];
}
