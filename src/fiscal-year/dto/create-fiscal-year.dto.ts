import { ApiProperty } from "@nestjs/swagger";
import { ValidateNested } from "class-validator";

export enum FiscalStatus{
    Open='Open',
    Close='Close'
}
export enum FiscalStatusByMonthly{
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
    monthly_status:FiscalStatusByMonthly;
}
export class CreateFiscalYearDto {
    @ApiProperty()
    code:string;

    @ApiProperty()
    fiscalYear:string;

    @ApiProperty({enum:['Open','Close']})
    status:FiscalStatus;

    @ApiProperty()
    startDate:Date;

    @ApiProperty()
    endDate:Date;

    // @ApiProperty()
    // monthlyPeriod:string;

    // @ValidateNested({each:true})
    // @ApiProperty({type:()=>[MonthlyPeriod]})
    // monthlyPeriod:MonthlyPeriod[];

}
