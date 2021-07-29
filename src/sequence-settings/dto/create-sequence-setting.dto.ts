import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsString } from 'class-validator';

export class CreateSequenceSettingDto {
  @ApiProperty()
  @IsString()
  readonly prefix: string;
  @ApiProperty()
  @IsString()
  readonly suffix: string;
  @ApiProperty()
  @IsNumber()
  readonly numDigits: number;
  @ApiProperty()
  @IsNumber()
  readonly nextNumber: number;
  @ApiProperty()
  @IsString()
  readonly modelName: string;
  @ApiProperty({
    default: false,
  })
  @IsBoolean()
  readonly year: boolean;
}
