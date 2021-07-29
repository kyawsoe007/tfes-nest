import { ApiProperty } from "@nestjs/swagger";

/*
export enum internalType{
    View = 'View',
    Regular = 'Regular',
    Receviable = 'Receviable',
    Payable = 'Payable',
    Liquidity='Liquidity'
}
*/

export class CreateAccountItemDto {
    @ApiProperty()
    accountCode: string;

    @ApiProperty()
    accountName: string;

    @ApiProperty()
    debit: string;   

    @ApiProperty()
    credit: string;

    @ApiProperty()
    balance: Number;

    @ApiProperty()
    internalType: string;

    @ApiProperty()
    companyCurrency: string;
}