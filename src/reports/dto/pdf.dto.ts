import { ApiProperty } from '@nestjs/swagger';
export class PdfDto{
    @ApiProperty({ required: false })
    startDate:Date;
    @ApiProperty({ required: false })
    endDate:Date;
}