import { ApiProperty } from "@nestjs/swagger";
import { ValidateNested } from "class-validator";

export enum FiscalStatus{
    Open='Open',
    Close='Close'
}
export class MonthlyPeriod{
    @ApiProperty()
    startOfPeriod:Date;

    @ApiProperty()
    endOfPeriod:Date;

    @ApiProperty()
    monthly_code:string;

    @ApiProperty()
    periodName:string;

    @ApiProperty({enum:['Open','Close']})
    monthly_status:FiscalStatus;
}
export class CreateFiscalPeriodDto {
    @ApiProperty()
    startOfDate:Date;

    @ApiProperty()
    endOfDate:Date;

    @ApiProperty()
    monthly_code:string;

    @ApiProperty()
    periodName:string;

    @ApiProperty({enum:['Open','Close']})
    monthly_status:FiscalStatus;

    @ApiProperty()
    fiscalYear:string;

    //  @ValidateNested({each:true})
    // @ApiProperty({type:()=>[MonthlyPeriod]})
    // monthlyPeriod:MonthlyPeriod[];
}
