import { ApiProperty } from "@nestjs/swagger";

export class FiscalYearByMonthly{
    @ApiProperty()
    startOfPeriod:Date;

    @ApiProperty()
    endOfPeriod:Date;

    @ApiProperty()
    code:string;

    @ApiProperty()
    periodName:string;

    @ApiProperty()
    checkMonth:number;

    @ApiProperty()
    id:string
}